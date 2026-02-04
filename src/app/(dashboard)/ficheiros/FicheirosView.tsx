"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Swal from "sweetalert2"

type UserFile = {
  id: string
  filename: string
  storedName: string
  mimeType: string
  size: number
  createdAt: string
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function getFileIcon(mimeType: string): { icon: string; color: string } {
  if (mimeType.startsWith("image/")) return { icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", color: "text-green-600" }
  if (mimeType === "application/pdf") return { icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z", color: "text-red-600" }
  if (mimeType.includes("word") || mimeType.includes("document")) return { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "text-blue-600" }
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet") || mimeType === "text/csv") return { icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "text-green-700" }
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z")) return { icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4", color: "text-yellow-600" }
  if (mimeType.startsWith("video/")) return { icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z", color: "text-purple-600" }
  if (mimeType.startsWith("audio/")) return { icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3", color: "text-pink-600" }
  return { icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z", color: "text-gray-500" }
}

function isPreviewable(mimeType: string): boolean {
  return mimeType.startsWith("image/") || 
         mimeType === "application/pdf" || 
         mimeType.startsWith("video/") || 
         mimeType.startsWith("audio/") ||
         mimeType === "text/plain" ||
         mimeType === "application/json" ||
         mimeType === "text/csv"
}

// Text file preview component
function TextPreview({ fileId }: { fileId: string }) {
  const [content, setContent] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch(`/api/files/${fileId}?preview=true`)
        if (res.ok) {
          const text = await res.text()
          setContent(text.slice(0, 50000)) // Limit to 50k chars
        }
      } catch (e) {
        setContent("Erro ao carregar ficheiro")
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [fileId])

  if (loading) return <div className="animate-pulse bg-gray-200 h-64 w-full rounded" />
  
  return (
    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[70vh] w-full text-sm font-mono">
      {content}
    </pre>
  )
}

export default function FicheirosView() {
  const searchParams = useSearchParams()
  const seller = searchParams.get("seller")
  const [files, setFiles] = useState<UserFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files" + (seller ? "?seller=" + seller : ""))
      if (res.ok) {
        const data = await res.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error("Error fetching files:", error)
    } finally {
      setLoading(false)
    }
  }, [seller])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) await uploadFiles(droppedFiles)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) await uploadFiles(selectedFiles)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const uploadFiles = async (filesToUpload: File[], overwrite = false) => {
    setUploading(true)
    try {
      const formData = new FormData()
      filesToUpload.forEach(file => formData.append("files", file))
      if (overwrite) {
        formData.append("overwrite", "true")
      }
      
      const res = await fetch("/api/files", { method: "POST", body: formData })
      const data = await res.json()
      
      if (res.status === 409 && data.error === "duplicate") {
        // File already exists, ask user if they want to overwrite
        const result = await Swal.fire({
          icon: "warning",
          title: "Ficheiro ja existe",
          text: `O ficheiro "${data.duplicates?.[0] || 'selecionado'}" ja existe. Queres substituir?`,
          showCancelButton: true,
          confirmButtonText: "Substituir",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#f59e0b"
        })
        
        if (result.isConfirmed) {
          // Retry upload with overwrite flag
          setUploading(false)
          await uploadFiles(filesToUpload, true)
          return
        }
      } else if (res.ok) {
        Swal.fire({ icon: "success", title: "Sucesso", text: data.message, confirmButtonColor: "#3b82f6" })
        fetchFiles()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Erro", text: error instanceof Error ? error.message : "Erro ao carregar ficheiros", confirmButtonColor: "#3b82f6" })
    } finally {
      setUploading(false)
    }
  }

  const downloadFile = async (file: UserFile) => {
    try {
      const res = await fetch(`/api/files/${file.id}`)
      if (!res.ok) throw new Error("Erro ao descarregar")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      Swal.fire({ icon: "error", title: "Erro", text: "Erro ao descarregar ficheiro", confirmButtonColor: "#3b82f6" })
    }
  }

  const deleteFile = async (file: UserFile) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Eliminar ficheiro?",
      text: `Tens a certeza que queres eliminar "${file.filename}"?`,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626"
    })
    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" })
        if (res.ok) {
          Swal.fire({ icon: "success", title: "Eliminado", text: "Ficheiro eliminado com sucesso", confirmButtonColor: "#3b82f6" })
          setFiles(prev => prev.filter(f => f.id !== file.id))
        } else throw new Error("Erro ao eliminar")
      } catch {
        Swal.fire({ icon: "error", title: "Erro", text: "Erro ao eliminar ficheiro", confirmButtonColor: "#3b82f6" })
      }
    }
  }

  const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase()))
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Total de Ficheiros</p>
          <p className="text-2xl font-bold text-foreground">{files.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Espaco Utilizado</p>
          <p className="text-2xl font-bold text-foreground">{formatFileSize(totalSize)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm col-span-2 md:col-span-1">
          <p className="text-sm text-muted-foreground">Tipos de Ficheiros</p>
          <p className="text-2xl font-bold text-foreground">{new Set(files.map(f => f.mimeType.split("/")[0])).size}</p>
        </div>
      </div>

      {/* Upload Area */}
      <div className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
        <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" id="file-upload" />
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-500 font-medium">Clica para selecionar</label>
            {" "}ou arrasta ficheiros para aqui
          </p>
          <p className="text-xs text-gray-500 mt-1">PDF, Word, Excel, imagens, videos, audio ate 50MB</p>
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">A carregar...</span>
            </div>
          </div>
        )}
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Pesquisar ficheiros..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg border ${viewMode === "grid" ? "bg-blue-100 border-blue-300 text-blue-600" : "bg-white border-gray-300 text-gray-600"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg border ${viewMode === "list" ? "bg-blue-100 border-blue-300 text-blue-600" : "bg-white border-gray-300 text-gray-600"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Files Display */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-border">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="mt-2 text-gray-600">{searchQuery ? "Nenhum ficheiro encontrado" : "Ainda nao tens ficheiros"}</p>
          <p className="text-sm text-gray-500">Carrega ficheiros para comecar</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFiles.map(file => {
            const { icon, color } = getFileIcon(file.mimeType)
            return (
              <div key={file.id} className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow group cursor-pointer" onClick={() => setPreviewFile(file)}>
                <div className="flex flex-col items-center">
                  {file.mimeType.startsWith("image/") ? (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img src={`/api/files/${file.id}?preview=true`} alt={file.filename} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className={`w-8 h-8 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                      </svg>
                    </div>
                  )}
                  <p className="mt-2 text-sm font-medium text-gray-800 text-center truncate w-full" title={file.filename}>{file.filename}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(file.createdAt)}</p>
                </div>
                <div className="flex justify-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); downloadFile(file) }} className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200" title="Descarregar">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteFile(file) }} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200" title="Eliminar">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ficheiro</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 hidden sm:table-cell">Tamanho</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 hidden md:table-cell">Data</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFiles.map(file => {
                const { icon, color } = getFileIcon(file.mimeType)
                return (
                  <tr key={file.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setPreviewFile(file)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {file.mimeType.startsWith("image/") ? (
                            <img src={`/api/files/${file.id}?preview=true`} alt={file.filename} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-800 truncate max-w-xs" title={file.filename}>{file.filename}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{formatFileSize(file.size)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{formatDate(file.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={(e) => { e.stopPropagation(); downloadFile(file) }} className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200" title="Descarregar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteFile(file) }} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200" title="Eliminar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewFile(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full bg-white rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-medium text-gray-800 truncate">{previewFile.filename}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadFile(previewFile)} className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
                <button onClick={() => setPreviewFile(null)} className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)] flex items-center justify-center bg-gray-100">
              {previewFile.mimeType.startsWith("image/") ? (
                <img src={`/api/files/${previewFile.id}?preview=true`} alt={previewFile.filename} className="max-w-full max-h-full object-contain" />
              ) : previewFile.mimeType === "application/pdf" ? (
                <iframe src={`/api/files/${previewFile.id}?preview=true`} className="w-full h-[70vh]" title={previewFile.filename} />
              ) : previewFile.mimeType.startsWith("video/") ? (
                <video controls className="max-w-full max-h-[70vh]">
                  <source src={`/api/files/${previewFile.id}?preview=true`} type={previewFile.mimeType} />
                </video>
              ) : previewFile.mimeType.startsWith("audio/") ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <svg className="w-24 h-24 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <audio controls className="w-full max-w-md"><source src={`/api/files/${previewFile.id}?preview=true`} type={previewFile.mimeType} /></audio>
                </div>
              ) : previewFile.mimeType === "text/plain" || previewFile.mimeType === "application/json" || previewFile.mimeType === "text/csv" ? (
                <TextPreview fileId={previewFile.id} />
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 mb-2">Pre-visualizacao nao disponivel</p>
                  <p className="text-sm text-gray-500">Clica em descarregar para abrir o ficheiro</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
