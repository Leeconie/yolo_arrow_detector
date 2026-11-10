# -*- coding: utf-8 -*-
"""
@fileoverview 一键启动脚本：同时拉起后端的 YOLO 识别服务与前端的 Vite 开发服务器
@usage
    python dev.py                       # 用当前解释器跑后端
    python dev.py --python <环境python>  # 指定解释器（如 conda 环境）
    python dev.py --backend             # 只启动后端
    python dev.py --frontend            # 只启动前端
    python dev.py --check               # 只做环境自检，不启动
@note
    1. 后端解释器的优先级：--python 参数 > 环境变量 ARCHERY_PYTHON > 当前解释器 sys.executable。
       推荐直接 conda activate jisuanji_shijue 后再 python dev.py，这样三者天然一致。
    2. Windows 下 pnpm 是 .cmd 脚本，必须经 cmd /c 调用，因此这里按平台拼命令。
    3. 依赖自检用子进程跑目标解释器，避免"用 A 解释器检查 B 环境"的误判。
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"
BACKEND_DIR = BASE_DIR / "backend"

BACKEND_PORT = int(os.environ.get("AI_BACKEND_PORT", "8000"))
FRONTEND_PORT = int(os.environ.get("FRONTEND_PORT", "4000"))

CYAN = "\033[36m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
RED = "\033[31m"
RESET = "\033[0m"


def supports_color() -> bool:
    if os.name != "nt":
        return sys.stdout.isatty()
    return bool(os.environ.get("WT_SESSION") or os.environ.get("TERM_PROGRAM"))


def c(text: str, color: str) -> str:
    return f"{color}{text}{RESET}" if supports_color() else text


# ==================== 解释器 ====================

# 本项目约定的 conda 环境名：当前解释器缺依赖时，自动切到这个环境
DEFAULT_CONDA_ENV = "jisuanji_shijue"

# 需要检查的模块 -> pip 包名
REQUIRED_MODULES = [
    ("fastapi", "fastapi"),
    ("uvicorn", "uvicorn"),
    ("ultralytics", "ultralytics"),
    ("cv2", "opencv-python"),
]

_CHECK_SNIPPET = """
import importlib, sys
missing = []
for mod in ("fastapi", "uvicorn", "ultralytics", "cv2"):
    try:
        importlib.import_module(mod)
    except Exception:
        missing.append(mod)
print("MISSING:" + ",".join(missing))
print("PYVER:" + sys.version.split()[0])
"""


def resolve_python(cli_value: str | None) -> str:
    """把 --python / 环境变量 / 当前解释器 归一成可执行路径。"""
    candidate = cli_value or os.environ.get("ARCHERY_PYTHON") or sys.executable
    candidate = os.path.expandvars(os.path.expanduser(candidate))
    path = Path(candidate)
    if path.exists():
        return str(path)
    # 允许只传解释器名（如 "python"），交给系统 PATH 解析
    return shutil.which(candidate) or candidate


def probe(python_exe: str) -> tuple[bool, str, list[str]]:
    """在目标解释器里探测依赖，返回 (能否运行, Python 版本, 缺失模块)。

    用子进程而不是 __import__，这样即使用 base 解释器启动 dev.py，
    检查的仍然是真正要跑后端的那个环境。
    """
    all_modules = list(dict(REQUIRED_MODULES).keys())
    try:
        result = subprocess.run(
            [python_exe, "-c", _CHECK_SNIPPET],
            capture_output=True,
            text=True,
            timeout=180,
        )
    except (OSError, subprocess.TimeoutExpired):
        return False, "", all_modules

    pyver = ""
    missing: list[str] = []
    for line in (result.stdout or "").splitlines():
        if line.startswith("PYVER:"):
            pyver = line[6:].strip()
        elif line.startswith("MISSING:"):
            missing = [m for m in line[8:].strip().split(",") if m]

    if result.returncode != 0 and not pyver:
        return False, "", all_modules
    return True, pyver, missing


def find_conda_env(name: str) -> str | None:
    """按名字在 conda 环境列表里定位解释器。"""
    try:
        result = subprocess.run(
            ["conda", "env", "list", "--json"],
            capture_output=True,
            text=True,
            timeout=90,
        )
        if result.returncode != 0:
            return None
        envs = json.loads(result.stdout).get("envs", [])
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return None

    for env in envs:
        if Path(env).name.lower() == name.lower():
            py = Path(env) / ("python.exe" if os.name == "nt" else "bin/python")
            if py.exists():
                return str(py)
    return None


def check_python_deps(python_exe: str) -> bool:
    """用目标解释器跑一段探针，确认后端依赖齐全。"""
    runnable, pyver, missing = probe(python_exe)
    if not runnable:
        print(c(f"✗ 解释器无法运行：{python_exe}", RED))
        return False

    print(f"  后端解释器: {python_exe}" + (f"  (Python {pyver})" if pyver else ""))

    if missing:
        pkg_map = dict(REQUIRED_MODULES)
        packages = ", ".join(pkg_map.get(m, m) for m in missing)
        print(c(f"✗ 后端依赖缺失: {packages}", RED))
        print("  安装方式：")
        print(
            c(
                f'    "{python_exe}" -m pip install -i '
                f"https://mirrors.aliyun.com/pypi/simple/ -r backend/requirements.txt",
                YELLOW,
            )
        )
        return False

    print(c("✓ 后端依赖齐全（fastapi / uvicorn / ultralytics / opencv）", GREEN))
    return True


def check_weights() -> bool:
    ok = True
    for name in ("arrow.pt", "pose.pt"):
        path = BACKEND_DIR / "weights" / name
        if path.exists():
            print(c(f"✓ 权重 {name} 存在（{path.stat().st_size / 1024 / 1024:.1f}MB）", GREEN))
        else:
            print(c(f"✗ 权重 {name} 缺失，请放到 backend/weights/", RED))
            ok = False
    return ok


def check_node_deps() -> bool:
    node_modules = FRONTEND_DIR / "node_modules"
    if node_modules.exists() and any(node_modules.iterdir()):
        print(c("✓ 前端依赖已安装（node_modules 存在）", GREEN))
        return True

    print(c("✗ 前端依赖未安装", RED))
    print(c("  请先执行：cd frontend && pnpm install", YELLOW))
    return False


# ==================== 进程管理 ====================


def backend_command(python_exe: str) -> list[str]:
    """后端启动命令。显式用目标解释器，保证跑在预期环境里。"""
    return [
        python_exe,
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        "127.0.0.1",
        "--port",
        str(BACKEND_PORT),
        "--log-level",
        "info",
    ]


def frontend_command() -> list[str]:
    """前端启动命令。Windows 下 pnpm 是 .cmd，需要 cmd /c 包装。"""
    pnpm = shutil.which("pnpm")
    if not pnpm:
        raise RuntimeError("未找到 pnpm，请先安装：npm i -g pnpm")

    base = ["run", "dev"]
    if os.name == "nt":
        return ["cmd", "/c", pnpm, *base]
    return [pnpm, *base]


def pump(stream, prefix: str, color: str) -> None:
    """把子进程输出逐行加上前缀转发到主控制台。"""
    try:
        for raw in iter(stream.readline, b""):
            line = raw.decode("utf-8", errors="replace").rstrip("\r\n")
            if line:
                print(f"{c(prefix, color)} {line}", flush=True)
    except (ValueError, OSError):
        pass
    finally:
        try:
            stream.close()
        except OSError:
            pass


def spawn(name: str, cmd: list[str], cwd: Path, color: str) -> subprocess.Popen:
    print(c(f"▶ 启动 {name}: {' '.join(cmd)}", color))
    process = subprocess.Popen(
        cmd,
        cwd=str(cwd),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        bufsize=0,
        env={**os.environ, "PYTHONUNBUFFERED": "1", "FORCE_COLOR": "1"},
    )
    threading.Thread(target=pump, args=(process.stdout, f"[{name}]", color), daemon=True).start()
    return process


def shutdown(processes: dict[str, subprocess.Popen]) -> None:
    for name, process in processes.items():
        if process.poll() is None:
            print(c(f"■ 停止 {name}（pid={process.pid}）", YELLOW))
            try:
                process.terminate()
            except OSError:
                pass

    deadline = time.time() + 5
    for process in processes.values():
        while process.poll() is None and time.time() < deadline:
            time.sleep(0.1)
        if process.poll() is None:
            try:
                process.kill()
            except OSError:
                pass


def main() -> int:
    parser = argparse.ArgumentParser(description="射箭 AI 系统一键启动")
    parser.add_argument("--python", help="后端使用的 Python 解释器路径（默认取当前解释器）")
    parser.add_argument("--backend", action="store_true", help="只启动后端")
    parser.add_argument("--frontend", action="store_true", help="只启动前端")
    parser.add_argument("--check", action="store_true", help="只做环境自检")
    args = parser.parse_args()

    only_backend = args.backend and not args.frontend
    only_frontend = args.frontend and not args.backend
    python_exe = resolve_python(args.python)

    print(c("=" * 62, CYAN))
    print(c("  射箭 AI 分析系统 · 开发环境启动器", CYAN))
    print(c("=" * 62, CYAN))

    # 没有显式指定解释器时，若当前解释器缺依赖，就试着切到约定的 conda 环境。
    # 只在"自动探测"模式下这么做，避免覆盖用户 --python 的显式选择。
    if not only_frontend and not args.python and not os.environ.get("ARCHERY_PYTHON"):
        runnable, _, missing = probe(python_exe)
        if not runnable or missing:
            alt = find_conda_env(DEFAULT_CONDA_ENV)
            if alt:
                alt_runnable, alt_ver, alt_missing = probe(alt)
                if alt_runnable and not alt_missing:
                    print(
                        c(
                            f"ℹ 当前解释器不满足依赖，自动切换到 conda 环境 {DEFAULT_CONDA_ENV}:",
                            YELLOW,
                        )
                    )
                    print(c(f"  {alt}  (Python {alt_ver})", YELLOW))
                    python_exe = alt

    ok = True
    if not only_frontend:
        ok &= check_python_deps(python_exe)
        ok &= check_weights()
    if not only_backend:
        ok &= check_node_deps()

    if args.check:
        return 0 if ok else 1
    if not ok:
        print(c("\n环境自检未通过，已中止启动。", RED))
        return 1

    processes: dict[str, subprocess.Popen] = {}
    try:
        if not only_frontend:
            processes["后端"] = spawn("后端", backend_command(python_exe), BACKEND_DIR, GREEN)
        if not only_backend:
            processes["前端"] = spawn("前端", frontend_command(), FRONTEND_DIR, CYAN)

        print()
        print(c(f"  后端接口文档: http://127.0.0.1:{BACKEND_PORT}/docs", GREEN))
        print(c(f"  AI 识别页面:  http://localhost:{FRONTEND_PORT}/ai-analysis", CYAN))
        print(c("  按 Ctrl+C 退出", YELLOW))
        print()

        while True:
            for name, process in processes.items():
                code = process.poll()
                if code is not None:
                    print(c(f"✗ {name} 进程已退出，退出码 {code}", RED))
                    shutdown(processes)
                    return code or 1
            time.sleep(0.5)

    except KeyboardInterrupt:
        print(c("\n收到退出信号，正在关闭…", YELLOW))
        return 0
    except RuntimeError as exc:
        print(c(f"✗ {exc}", RED))
        return 1
    finally:
        shutdown(processes)


if __name__ == "__main__":
    if os.name == "nt":
        # 让 Ctrl+C 能正常传到子进程
        signal.signal(signal.SIGINT, signal.default_int_handler)
    sys.exit(main())
