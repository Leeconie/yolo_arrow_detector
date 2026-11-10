import cv2
from ultralytics import YOLO
import numpy as np
import os
from typing import Tuple, Optional, List, Dict
import tempfile
import logging
import math

logger = logging.getLogger(__name__)

class ArrowTracker:
    """箭矢追踪器，用于处理抖动和计数逻辑"""
    
    def __init__(self, max_distance: float = 80.0, stability_threshold: int = 10, min_detection_confidence: float = 0.3):
        self.max_distance = max_distance  # 增加最大移动距离，允许更大的位置变化
        self.stability_threshold = stability_threshold  # 降低稳定所需帧数
        self.min_detection_confidence = min_detection_confidence  # 降低最小检测置信度
        
        self.arrows: Dict[int, Dict] = {}  # 存储箭矢信息
        self.next_arrow_id = 1  # 下一个箭矢ID
        self.frame_count = 0  # 帧计数器
        
    def calculate_centroid(self, bbox: List[float]) -> Tuple[float, float]:
        """计算边界框中心点"""
        x1, y1, x2, y2 = bbox
        return (x1 + x2) / 2, (y1 + y2) / 2
    
    def distance(self, point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
        """计算两点间距离"""
        return math.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)
    
    def find_matching_arrow(self, new_bbox: List[float]) -> Optional[int]:
        """查找匹配的箭矢ID"""
        new_centroid = self.calculate_centroid(new_bbox)
        
        for arrow_id, arrow_info in self.arrows.items():
            # 检查当前箭矢是否稳定
            if arrow_info['stable']:
                # 如果箭矢已稳定，只考虑距离较近的新检测
                old_centroid = self.calculate_centroid(arrow_info['bbox'])
                if self.distance(new_centroid, old_centroid) <= self.max_distance:
                    return arrow_id
            else:
                # 如果箭矢未稳定，考虑最近的候选
                old_centroid = self.calculate_centroid(arrow_info['bbox'])
                if self.distance(new_centroid, old_centroid) <= self.max_distance:
                    return arrow_id
        
        return None
    
    def update_arrows(self, detections: List[Dict]) -> Dict:
        """更新箭矢追踪信息"""
        self.frame_count += 1
        
        # 按置信度降序排列，优先处理高置信度的检测
        sorted_detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)
        
        used_detections = set()
        current_arrows = {}
        
        for det in sorted_detections:
            if det['id'] in used_detections:
                continue
                
            matching_arrow_id = self.find_matching_arrow(det['bbox'])
            
            if matching_arrow_id is not None:
                # 更新现有箭矢
                arrow_info = self.arrows[matching_arrow_id]
                
                # 更新位置和边界框
                old_centroid = self.calculate_centroid(arrow_info['bbox'])
                new_centroid = self.calculate_centroid(det['bbox'])
                
                # 更新移动历史
                arrow_info['positions'].append(new_centroid)
                
                # 如果移动距离很小，则增加稳定性计数
                dist_moved = self.distance(old_centroid, new_centroid)
                if dist_moved < 10.0:  # 增加稳定阈值，允许更大的小幅移动
                    arrow_info['stability_frames'] += 1
                else:
                    arrow_info['stability_frames'] = max(0, arrow_info['stability_frames'] - 1)  # 减少稳定性惩罚
                
                arrow_info['bbox'] = det['bbox']
                arrow_info['confidence'] = det['confidence']
                arrow_info['last_seen_frame'] = self.frame_count
                arrow_info['stable'] = arrow_info['stability_frames'] >= self.stability_threshold
                
                current_arrows[matching_arrow_id] = arrow_info
                used_detections.add(det['id'])
            else:
                # 添加新箭矢
                new_arrow_id = self.next_arrow_id
                self.next_arrow_id += 1
                
                centroid = self.calculate_centroid(det['bbox'])
                current_arrows[new_arrow_id] = {
                    'id': new_arrow_id,
                    'bbox': det['bbox'],
                    'confidence': det['confidence'],
                    'positions': [centroid],
                    'first_seen_frame': self.frame_count,
                    'last_seen_frame': self.frame_count,
                    'stability_frames': 0,
                    'stable': False,
                    'appeared': False  # 是否已经稳定出现过
                }
        
        # 检查之前存在的箭矢是否仍然可见
        for arrow_id, arrow_info in self.arrows.items():
            if arrow_id not in current_arrows:
                # 箭矢不再可见，但在一定时间内仍保持追踪
                if self.frame_count - arrow_info['last_seen_frame'] < 20:  # 增加丢失后继续追踪的帧数
                    arrow_info['last_seen_frame'] = self.frame_count
                    current_arrows[arrow_id] = arrow_info
        
        self.arrows = current_arrows
        
        # 统计稳定箭矢
        stable_arrows = {aid: info for aid, info in self.arrows.items() 
                         if info['stable'] and not info['appeared']}
        
        # 标记新稳定的箭矢
        for arrow_id in stable_arrows:
            self.arrows[arrow_id]['appeared'] = True
        
        return self.get_summary()
    
    def get_summary(self) -> Dict:
        """获取当前箭矢统计摘要"""
        total_arrows = len([a for a in self.arrows.values() if a['appeared']])
        stable_arrows = len([a for a in self.arrows.values() if a['stable']])
        all_arrows = []
        
        for arrow_id, info in self.arrows.items():
            arrow_data = {
                'arrow_id': arrow_id,
                'bbox': info['bbox'],
                'confidence': info['confidence'],
                'stable': info['stable'],
                'appeared': info['appeared'],
                'first_seen_frame': info['first_seen_frame'],
                'last_seen_frame': info['last_seen_frame'],
                'stability_frames': info['stability_frames']
            }
            all_arrows.append(arrow_data)
        
        return {
            'total_arrows_shot': total_arrows,
            'current_stable_arrows': stable_arrows,
            'all_arrows': all_arrows,
            'frame_count': self.frame_count
        }

class VideoProcessor:
    def __init__(self, weights_dir: str = "weights"):
        """
        初始化视频处理器
        
        Args:
            weights_dir: 权重文件目录路径
        """
        self.weights_dir = weights_dir
        self.arrow_model_path = os.path.join(weights_dir, "arrow.pt")
        self.pose_model_path = os.path.join(weights_dir, "pose.pt")
        
        # 加载模型
        if not os.path.exists(self.arrow_model_path):
            raise FileNotFoundError(f"Arrow model not found at {self.arrow_model_path}")
        if not os.path.exists(self.pose_model_path):
            raise FileNotFoundError(f"Pose model not found at {self.pose_model_path}")
            
        self.arrow_model = YOLO(self.arrow_model_path)
        self.pose_model = YOLO(self.pose_model_path)

    def process_arrow_video_with_tracking(self, input_video_path: str) -> Tuple[str, dict]:
        """
        处理箭头视频 - 使用YOLO检测整个视频中的箭头并进行计数
        
        Args:
            input_video_path: 输入视频路径
            
        Returns:
            Tuple[输出视频路径, 检测结果JSON]
        """
        logger.info(f"Processing arrow video with tracking: {input_video_path}")
        
        cap = cv2.VideoCapture(input_video_path)
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        # 创建临时输出视频文件
        output_video_path = tempfile.mktemp(suffix='.mp4')
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

        # 初始化箭矢追踪器，使用更宽松的参数
        tracker = ArrowTracker(max_distance=80.0, stability_threshold=10)
        
        detection_results = {
            'detections': [],
            'tracking_summary': [],
            'video_info': {
                'fps': fps,
                'width': width,
                'height': height,
                'total_frames': total_frames
            }
        }

        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # 使用箭头模型进行推理
            results = self.arrow_model(frame)
            
            # 收集当前帧的检测结果
            current_detections = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for i, box in enumerate(boxes):
                        conf = float(box.conf[0])
                        cls = int(box.cls[0])
                        bbox = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                        
                        detection_data = {
                            'id': i,
                            'frame': frame_idx,
                            'confidence': conf,
                            'class_id': cls,
                            'bbox': bbox
                        }
                        
                        if conf > 0.2:  # 降低检测阈值
                            current_detections.append(detection_data)
                        
                        detection_results['detections'].append(detection_data)

            # 更新箭矢追踪
            tracking_summary = tracker.update_arrows(current_detections)
            
            # 在帧上绘制检测结果和追踪信息
            annotated_frame = results[0].plot()
            
            # 绘制追踪ID和稳定性状态
            for arrow_id, arrow_info in tracker.arrows.items():
                if arrow_info['appeared']:  # 只绘制已经稳定的箭矢
                    bbox = arrow_info['bbox']
                    x1, y1, x2, y2 = map(int, bbox)
                    
                    # 根据稳定性绘制不同颜色的框
                    color = (0, 255, 0) if arrow_info['stable'] else (0, 255, 255)
                    thickness = 2 if arrow_info['stable'] else 1
                    
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, thickness)
                    cv2.putText(annotated_frame, f'Arrow #{arrow_id}', 
                               (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            
            # 显示总计数
            cv2.putText(annotated_frame, f'Total Arrows: {tracking_summary["total_arrows_shot"]}', 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(annotated_frame, f'Stable Arrows: {tracking_summary["current_stable_arrows"]}', 
                       (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            
            out.write(annotated_frame)
            
            # 记录追踪摘要
            detection_results['tracking_summary'].append(tracking_summary.copy())

            if frame_idx % 50 == 0:  # 每50帧打印一次进度
                logger.debug(f"Processed {frame_idx}/{total_frames} frames, "
                           f"Total arrows shot: {tracking_summary['total_arrows_shot']}, "
                           f"Current stable: {tracking_summary['current_stable_arrows']}")

            frame_idx += 1

        cap.release()
        out.release()

        logger.info(f"Arrow video processing completed. Output saved to: {output_video_path}")
        logger.info(f"Total arrows detected: {detection_results['tracking_summary'][-1]['total_arrows_shot'] if detection_results['tracking_summary'] else 0}")
        
        return output_video_path, detection_results

    def process_arrow_video(self, input_video_path: str) -> Tuple[str, dict]:
        """
        处理箭头视频 - 使用YOLO检测整个视频中的箭头
        
        Args:
            input_video_path: 输入视频路径
            
        Returns:
            Tuple[输出视频路径, 检测结果JSON]
        """
        logger.info(f"Processing arrow video: {input_video_path}")
        
        cap = cv2.VideoCapture(input_video_path)
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        # 创建临时输出视频文件
        output_video_path = tempfile.mktemp(suffix='.mp4')
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

        detection_results = {
            'detections': [],
            'video_info': {
                'fps': fps,
                'width': width,
                'height': height,
                'total_frames': total_frames
            }
        }

        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # 使用箭头模型进行推理
            results = self.arrow_model(frame)
            
            # 在帧上绘制检测结果
            annotated_frame = results[0].plot()
            out.write(annotated_frame)

            # 收集检测结果
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        conf = float(box.conf[0])
                        cls = int(box.cls[0])
                        bbox = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                        
                        detection_results['detections'].append({
                            'frame': frame_idx,
                            'confidence': conf,
                            'class_id': cls,
                            'bbox': bbox
                        })

            if frame_idx % 50 == 0:  # 每50帧打印一次进度
                logger.debug(f"Processed {frame_idx}/{total_frames} frames")

            frame_idx += 1

        cap.release()
        out.release()

        logger.info(f"Arrow video processing completed. Output saved to: {output_video_path}")
        return output_video_path, detection_results

    def process_pose_video(self, input_video_path: str) -> Tuple[str, dict]:
        """
        处理姿势视频 - 使用YOLO Pose检测整个视频中的人体姿态
        
        Args:
            input_video_path: 输入视频路径
            
        Returns:
            Tuple[输出视频路径, 检测结果JSON]
        """
        logger.info(f"Processing pose video: {input_video_path}")

        cap = cv2.VideoCapture(input_video_path)
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        # 创建临时输出视频文件
        output_video_path = tempfile.mktemp(suffix='.mp4')
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

        detection_results = {
            'poses': [],
            'video_info': {
                'fps': fps,
                'width': width,
                'height': height,
                'total_frames': total_frames
            }
        }

        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # 使用姿态模型进行推理
            results = self.pose_model(frame)
            
            # 在帧上绘制检测结果
            annotated_frame = results[0].plot()
            out.write(annotated_frame)

            # 收集姿态检测结果
            for result in results:
                keypoints = result.keypoints
                boxes = result.boxes
                
                if keypoints is not None and len(keypoints) > 0:
                    for i, kpts in enumerate(keypoints):
                        if kpts.conf is not None:  # 确保关键点置信度存在
                            person_data = {
                                'frame': frame_idx,
                                'person_id': i,
                                'keypoints': kpts.xy.tolist(),  # 关键点坐标
                                'keypoint_confidence': kpts.conf.tolist() if kpts.conf is not None else []
                            }
                            
                            # 如果有边界框信息也保存
                            if boxes is not None and i < len(boxes):
                                box = boxes[i]
                                person_data['bbox'] = box.xyxy[0].tolist()
                                person_data['confidence'] = float(box.conf[0]) if box.conf is not None else 0.0
                            
                            detection_results['poses'].append(person_data)

            if frame_idx % 50 == 0:  # 每50帧打印一次进度
                logger.debug(f"Processed {frame_idx}/{total_frames} frames")

            frame_idx += 1

        cap.release()
        out.release()

        logger.info(f"Pose video processing completed. Output saved to: {output_video_path}")
        return output_video_path, detection_results