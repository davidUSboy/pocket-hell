# Publish Pocket Hell v2

The project is ready to deploy. The included scripts clone the current public repository into a temporary folder, copy the v2 files over it, commit the result, and push `main`.

## Windows

Right-click `publish-to-github.ps1` and run it with PowerShell, or execute:

```powershell
powershell -ExecutionPolicy Bypass -File .\publish-to-github.ps1
```

## macOS / Linux

```bash
chmod +x publish-to-github.sh
./publish-to-github.sh
```

Git may open the normal GitHub authentication flow if this computer is not already signed in. After the push, GitHub Actions validates and deploys the Pages site automatically.
