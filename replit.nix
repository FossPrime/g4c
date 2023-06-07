{ pkgs }: { deps = with pkgs; [
  less
  netcat-openbsd
  bashInteractive
  nodejs-18_x
    nodePackages.typescript
    nodePackages.typescript-language-server
    nodePackages.pnpm
]; }
