with import (builtins.fetchGit {
  name = "nixpkgs-unstable-2019-02-02";
  url = https://github.com/nixos/nixpkgs/;
  rev = "11cf7d6e1ffd5fbc09a51b76d668ad0858a772ed";
}) {};



let
  inherit (pkgs) mkShell;
in mkShell {
  buildInputs = with pkgs; [
    nodejs-11_x
  ];
}
