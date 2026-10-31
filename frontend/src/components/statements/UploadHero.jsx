// Statements drag-and-drop upload area with file picker and the sample-batch button.
import { useState } from 'react';
import { CloudUpload, Database, FolderOpen, Lock, Shield } from 'lucide-react';

export default function UploadHero({ onLoadDemo, onChooseFiles, onDropFiles }) {
  const [dragging, setDragging] = useState(false);
  return (
    <section data-tour="upload-area" className="relative bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden p-space-xl transition-all">
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />
      <div
        className={`relative rounded-xl p-space-2xl flex flex-col items-center justify-center text-center transition-colors ${dragging ? 'bg-secondary-fixed/40' : 'bg-surface-container-low/60'}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onDropFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <div className="w-16 h-16 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center text-primary shadow-sm mb-space-md">
          <CloudUpload size={36} />
        </div>
        <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Drop bank statements here or click to browse</h2>
        <p className="font-body-md text-body-md text-secondary mt-1 max-w-xl">
          Accepts HDFC PDF statements and CSV exports from HDFC and Kotak.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-space-sm mt-space-md">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-secondary shadow-sm">
            <Lock size={15} className="text-primary" /> Password-protected PDFs supported
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-secondary shadow-sm">
            <Database size={15} className="text-secondary" /> Up to 50MB per file
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-secondary shadow-sm">
            <Shield size={15} className="text-primary" /> 256-bit local parsing (no cloud transfer)
          </span>
        </div>
        <div className="flex items-center gap-space-md mt-space-lg">
          <button
            className="h-10 px-space-lg rounded-lg bg-primary-container text-white hover:bg-primary font-label-md text-label-md flex items-center gap-2 shadow-sm transition-all"
            onClick={onChooseFiles}
          >
            <FolderOpen size={18} />
            <span>Choose Files from Device</span>
          </button>
          <button
            className="h-10 px-space-md rounded-lg bg-surface-container-lowest text-secondary hover:text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors shadow-sm"
            onClick={onLoadDemo}
          >
            Use the demo statements
          </button>
        </div>
      </div>
    </section>
  );
}
