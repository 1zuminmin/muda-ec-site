# Optional Windows-only preview server. The site itself needs no runtime.
param([int]$Port = 8080)
$ErrorActionPreference = 'Stop'
$siteRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$types = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.svg'='image/svg+xml'; '.png'='image/png'; '.ico'='image/x-icon' }
try {
    $listener.Start()
    Write-Output "Local: http://localhost:$Port/  (Ctrl+C to stop)"
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $client.ReceiveTimeout = 3000
        $stream = $client.GetStream()
        try {
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
            $request = $reader.ReadLine()
            while ($reader.ReadLine()) { }
            $requestPath = ($request -split ' ')[1]
            $relative = [Uri]::UnescapeDataString(($requestPath -split '\?')[0]).TrimStart('/')
            if (!$relative) { $relative = 'index.html' }
            $file = [System.IO.Path]::GetFullPath((Join-Path $siteRoot $relative))
            $extension = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
            if (!$file.StartsWith($siteRoot + [System.IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or !$types.ContainsKey($extension) -or !(Test-Path -LiteralPath $file -PathType Leaf)) {
                $status = '404 Not Found'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not found')
                $contentType = 'text/plain'
            } else {
                $status = '200 OK'
                $bytes = [System.IO.File]::ReadAllBytes($file)
                $contentType = $types[$extension]
            }
            $header = [System.Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`nCache-Control: no-store`r`nX-Content-Type-Options: nosniff`r`n`r`n")
            $stream.Write($header, 0, $header.Length)
            if ($request -notlike 'HEAD *') { $stream.Write($bytes, 0, $bytes.Length) }
        } catch { Write-Verbose $_ }
        finally { $client.Close() }
    }
} finally { $listener.Stop() }
