{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    bun
  ];

  shellHook = ''
    echo "anyWarehouse_front dev shell (bun $(bun --version))"

    # 依赖按 bun.lock 安装，只有缺失时才自动安装，避免每次进 shell 都联网
    if [ ! -d node_modules ]; then
      echo "node_modules 不存在，执行 bun install ..."
      bun install
    fi
  '';
}
