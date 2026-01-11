
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  FilePlus, 
  Trash2, 
  ChevronLeft,
  FileCode,
  Braces,
  Terminal,
  Code,
  FolderPlus,
  Folder,
  ChevronRight,
  Home,
  Edit2,
  MoreVertical,
  File,
  Hash,
  X,
  Check,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { ProjectFile, ProjectFolder, Language } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';

interface FileExplorerProps {
  files: ProjectFile[];
  folders: ProjectFolder[];
  activeFileId: string;
  onFileSelect: (id: string) => void;
  onFileAdd: (name: string, language: Language, parentId?: string) => void;
  onFolderAdd: (name: string, parentId?: string) => void;
  onFileDelete: (id: string) => void;
  onFolderDelete: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onMoveItem: (itemId: string, itemType: 'file' | 'folder', newParentId?: string) => void;
  onItemRename: (id: string, type: 'file' | 'folder', newName: string) => void;
  isDarkMode?: boolean;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetId: string | null;
  targetType: 'file' | 'folder' | 'root';
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  folders,
  activeFileId,
  onFileSelect,
  onFileAdd,
  onFolderAdd,
  onFileDelete,
  onFolderDelete,
  onMoveItem,
  onItemRename,
  isDarkMode = true
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [isAddingFile, setIsAddingFile] = useState<{ active: boolean; parentId?: string }>({ active: false });
  const [isAddingFolder, setIsAddingFolder] = useState<{ active: boolean; parentId?: string }>({ active: false });
  const [isRenaming, setIsRenaming] = useState<{ active: boolean; id: string; type: 'file' | 'folder' }>({ active: false, id: '', type: 'file' });
  const [newName, setNewName] = useState('');
  const [newFileLang, setNewFileLang] = useState<Language>(Language.PYTHON);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, targetId: null, targetType: 'root' });
  const [renamedId, setRenamedId] = useState<string | null>(null);
  
  // State for the custom deletion confirmation modal
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'file' | 'folder', name: string } | null>(null);

  const explorerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const currentFolder = useMemo(() => 
    folders.find(f => f.id === currentFolderId), 
    [folders, currentFolderId]
  );

  const breadcrumbs = useMemo(() => {
    const crumbs = [];
    let curr = currentFolder;
    while (curr) {
      crumbs.unshift(curr);
      curr = folders.find(f => f.id === curr?.parentId);
    }
    return crumbs;
  }, [currentFolder, folders]);

  const handleAddFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onFileAdd(newName.trim(), newFileLang, isAddingFile.parentId);
      setNewName('');
      setIsAddingFile({ active: false });
    }
  };

  const handleAddFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onFolderAdd(newName.trim(), isAddingFolder.parentId);
      setNewName('');
      setIsAddingFolder({ active: false });
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      const targetId = isRenaming.id;
      onItemRename(targetId, isRenaming.type, newName.trim());
      setNewName('');
      setIsRenaming({ active: false, id: '', type: 'file' });
      setRenamedId(targetId);
      setTimeout(() => setRenamedId(null), 1500);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, id: string | null, type: 'file' | 'folder' | 'root') => {
    e.preventDefault();
    e.stopPropagation();
    
    let x = e.clientX;
    let y = e.clientY;
    
    const menuWidth = 180;
    const menuHeight = 160;
    if (x + menuWidth > window.innerWidth) x -= menuWidth;
    if (y + menuHeight > window.innerHeight) y -= menuHeight;

    setContextMenu({ visible: true, x, y, targetId: id, targetType: type });
  };

  const startRename = (id: string, type: 'file' | 'folder', currentName: string) => {
    setIsRenaming({ active: true, id, type });
    setNewName(currentName);
  };

  const triggerDeleteConfirmation = () => {
    const id = contextMenu.targetId;
    if (!id) return;

    let name = '';
    if (contextMenu.targetType === 'file') {
      name = files.find(f => f.id === id)?.name || 'Unknown File';
    } else {
      name = folders.find(f => f.id === id)?.name || 'Unknown Folder';
    }

    setItemToDelete({ id, type: contextMenu.targetType as 'file' | 'folder', name });
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'file') {
      onFileDelete(itemToDelete.id);
    } else {
      onFolderDelete(itemToDelete.id);
    }
    
    setItemToDelete(null);
  };

  const getFileIcon = (fileName: string, lang: Language, isActive: boolean) => {
    const iconProps = { size: 16, className: isActive ? 'text-white' : '' };
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'py': return <FileCode {...iconProps} className={`${iconProps.className} text-blue-400`} />;
      case 'js': return <FileCode {...iconProps} className={`${iconProps.className} text-yellow-400`} />;
      case 'ts': return <FileCode {...iconProps} className={`${iconProps.className} text-blue-500`} />;
      case 'cpp':
      case 'cc':
      case 'cxx': return <Code {...iconProps} className={`${iconProps.className} text-blue-600`} />;
      case 'c': return <Code {...iconProps} className={`${iconProps.className} text-slate-400`} />;
      case 'java': return <FileCode {...iconProps} className={`${iconProps.className} text-orange-600`} />;
      case 'cs': return <Hash {...iconProps} className={`${iconProps.className} text-purple-500`} />;
      case 'rs': return <FileCode {...iconProps} className={`${iconProps.className} text-orange-500`} />;
      case 'lua': return <FileCode {...iconProps} className={`${iconProps.className} text-indigo-400`} />;
      case 'rb': return <FileCode {...iconProps} className={`${iconProps.className} text-red-500`} />;
      case 'go': return <FileCode {...iconProps} className={`${iconProps.className} text-cyan-500`} />;
      case 'swift': return <FileCode {...iconProps} className={`${iconProps.className} text-orange-400`} />;
      case 'json': return <Braces {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
      default: return <File {...iconProps} className={`${iconProps.className} text-slate-500`} />;
    }
  };

  const filteredFolders = folders.filter(f => f.parentId === currentFolderId);
  const filteredFiles = files.filter(f => f.parentId === currentFolderId);

  return (
    <div 
      className={`relative w-full h-full border-r flex flex-col select-none transition-colors duration-300
        ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} 
        ${dragOverId === 'root' ? (isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100') : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOverId('root'); }}
      onDrop={(e) => { e.preventDefault(); setDragOverId(null); onMoveItem(e.dataTransfer.getData('itemId'), e.dataTransfer.getData('itemType') as any, currentFolderId); }}
      onContextMenu={(e) => handleContextMenu(e, null, 'root')}
    >
      <div className={`p-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Explorer</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsAddingFile({ active: true, parentId: currentFolderId })} className="p-1 hover:bg-slate-500/10 rounded text-slate-400 transition-colors" title="New File"><FilePlus size={14} /></button>
            <button onClick={() => setIsAddingFolder({ active: true, parentId: currentFolderId })} className="p-1 hover:bg-slate-500/10 rounded text-slate-400 transition-colors" title="New Folder"><FolderPlus size={14} /></button>
          </div>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          <button onClick={() => setCurrentFolderId(undefined)} className="p-1 text-slate-500 hover:text-blue-500 transition-colors"><Home size={14} /></button>
          {breadcrumbs.map(crumb => (
            <React.Fragment key={crumb.id}>
              <ChevronRight size={10} className="text-slate-600 shrink-0" />
              <button onClick={() => setCurrentFolderId(crumb.id)} className="text-[11px] text-slate-400 hover:text-white px-1 whitespace-nowrap transition-colors">{crumb.name}</button>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-2">
        {currentFolderId && (
          <div onClick={() => setCurrentFolderId(currentFolder?.parentId)} className="flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-slate-500 hover:bg-slate-500/10 mb-1 transition-colors">
            <ChevronLeft size={14} /><span className="text-sm font-medium">..</span>
          </div>
        )}

        {(isAddingFile.active && isAddingFile.parentId === currentFolderId) && (
          <form onSubmit={handleAddFileSubmit} className={`mb-2 p-2 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'} rounded-lg border border-blue-500/30`}>
            <input autoFocus className={`${isDarkMode ? 'bg-slate-950 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'} border rounded px-2 py-1 text-xs mb-2 outline-none w-full`} placeholder="filename.py" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <select className={`${isDarkMode ? 'bg-slate-950 text-slate-400 border-slate-700' : 'bg-white text-slate-600 border-slate-200'} border w-full text-[10px] mb-2 p-1 rounded outline-none`} value={newFileLang} onChange={(e) => setNewFileLang(e.target.value as Language)}>
              {SUPPORTED_LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <div className="flex gap-2">
               <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] py-1 rounded font-semibold transition-colors">Create</button>
               <button type="button" onClick={() => setIsAddingFile({ active: false })} className="flex-1 text-slate-400 hover:text-slate-300 text-[10px] transition-colors">Cancel</button>
            </div>
          </form>
        )}

        {(isAddingFolder.active && isAddingFolder.parentId === currentFolderId) && (
          <form onSubmit={handleAddFolderSubmit} className={`mb-2 p-2 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'} rounded-lg border border-blue-500/30`}>
            <input autoFocus className={`${isDarkMode ? 'bg-slate-950 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'} border rounded px-2 py-1 text-xs mb-2 outline-none w-full`} placeholder="Folder name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <div className="flex gap-2">
               <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] py-1 rounded font-semibold transition-colors">Create</button>
               <button type="button" onClick={() => setIsAddingFolder({ active: false })} className="flex-1 text-slate-400 hover:text-slate-300 text-[10px] transition-colors">Cancel</button>
            </div>
          </form>
        )}

        <div className="space-y-0.5">
          {filteredFolders.map(folder => (
            <div key={folder.id}>
              {isRenaming.active && isRenaming.id === folder.id ? (
                <form onSubmit={handleRenameSubmit} className="p-1 bg-slate-800/50 rounded border border-blue-500">
                  <input autoFocus className="w-full bg-transparent text-white text-xs outline-none" value={newName} onChange={(e) => setNewName(e.target.value)} onBlur={() => setIsRenaming({ active: false, id: '', type: 'file' })} />
                </form>
              ) : (
                <div
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('itemId', folder.id); e.dataTransfer.setData('itemType', 'folder'); }}
                  onClick={() => setCurrentFolderId(folder.id)}
                  onContextMenu={(e) => handleContextMenu(e, folder.id, 'folder')}
                  className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-slate-500/10 text-slate-400 transition-colors`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Folder size={16} className="text-yellow-600 shrink-0" />
                    <span className="text-sm truncate font-medium">{folder.name}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleContextMenu(e as any, folder.id, 'folder'); }} className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity"><MoreVertical size={14}/></button>
                </div>
              )}
            </div>
          ))}

          {filteredFiles.map(file => (
            <div key={file.id}>
              {isRenaming.active && isRenaming.id === file.id ? (
                <form onSubmit={handleRenameSubmit} className="p-1 bg-slate-800/50 rounded border border-blue-500">
                   <input autoFocus className="w-full bg-transparent text-white text-xs outline-none" value={newName} onChange={(e) => setNewName(e.target.value)} onBlur={() => setIsRenaming({ active: false, id: '', type: 'file' })} />
                </form>
              ) : (
                <div
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('itemId', file.id); e.dataTransfer.setData('itemType', 'file'); }}
                  onClick={() => onFileSelect(file.id)}
                  onContextMenu={(e) => handleContextMenu(e, file.id, 'file')}
                  className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${activeFileId === file.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-500/10'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {getFileIcon(file.name, file.language, activeFileId === file.id)}
                    <span className="text-sm truncate font-medium">{file.name}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleContextMenu(e as any, file.id, 'file'); }} className={`opacity-0 group-hover:opacity-100 transition-opacity ${activeFileId === file.id ? 'text-white' : 'hover:text-white'}`}><MoreVertical size={14}/></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className={`fixed z-[100] w-48 border rounded-xl shadow-2xl py-1 backdrop-blur-xl animate-in fade-in zoom-in duration-100
            ${isDarkMode ? 'bg-slate-800/90 border-slate-700 text-slate-300' : 'bg-white/90 border-slate-200 text-slate-700'}`}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={(e) => { 
              e.stopPropagation();
              const parentId = contextMenu.targetType === 'folder' ? contextMenu.targetId! : currentFolderId;
              setIsAddingFile({ active: true, parentId }); 
              setContextMenu(p => ({ ...p, visible: false })); 
            }} 
            className="w-full text-left px-4 py-2 text-xs hover:bg-blue-600 hover:text-white flex items-center gap-2 transition-colors"
          >
            <FilePlus size={14} /> New File
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation();
              const parentId = contextMenu.targetType === 'folder' ? contextMenu.targetId! : currentFolderId;
              setIsAddingFolder({ active: true, parentId }); 
              setContextMenu(p => ({ ...p, visible: false })); 
            }} 
            className="w-full text-left px-4 py-2 text-xs hover:bg-blue-600 hover:text-white flex items-center gap-2 transition-colors"
          >
            <FolderPlus size={14} /> New Folder
          </button>

          {contextMenu.targetType !== 'root' && (
            <>
              <div className={`h-px my-1 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
              <button 
                onClick={(e) => { 
                  e.stopPropagation();
                  const item = contextMenu.targetType === 'file' ? files.find(f => f.id === contextMenu.targetId) : folders.find(f => f.id === contextMenu.targetId); 
                  if (item) startRename(contextMenu.targetId!, contextMenu.targetType as any, item.name); 
                  setContextMenu(p => ({ ...p, visible: false })); 
                }} 
                className="w-full text-left px-4 py-2 text-xs hover:bg-blue-600 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Edit2 size={14} /> Rename
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); triggerDeleteConfirmation(); }} 
                className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-600 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Modern Deletion Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            className={`w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden p-6 animate-in zoom-in duration-200
              ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
          >
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <div className={`p-2 rounded-full ${isDarkMode ? 'bg-red-500/10' : 'bg-red-50'}`}>
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold">Delete {itemToDelete.type}?</h3>
            </div>
            
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Are you sure you want to delete <span className="font-bold text-blue-500">"{itemToDelete.name}"</span>? 
              {itemToDelete.type === 'folder' && " All nested files and folders will be permanently removed. This action cannot be undone."}
              {itemToDelete.type === 'file' && " This action cannot be undone."}
            </p>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-colors
                  ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
