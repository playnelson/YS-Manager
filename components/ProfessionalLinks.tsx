
import React, { useState, useMemo } from 'react';
import { Plus, Globe, ExternalLink, Trash2, Search, Tag, Edit2 } from 'lucide-react';
import { ProfessionalLink } from '../types';
import { Button } from './ui/Button';

interface ProfessionalLinksProps {
  links: ProfessionalLink[];
  onChange: (links: ProfessionalLink[]) => void;
}

export const ProfessionalLinks: React.FC<ProfessionalLinksProps> = ({ links, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ProfessionalLink | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: 'Geral'
  });

  const categories = useMemo(() => {
    const cats = new Set(links.map(l => l.category));
    return ['Todos', ...Array.from(cats)].filter(c => c !== 'Todos');
  }, [links]);

  const filteredLinks = links.filter(link => 
    link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;

    let formattedUrl = formData.url.trim();
    if (!formattedUrl.startsWith('http')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newLink: ProfessionalLink = {
      id: editingLink?.id || `link_${Date.now()}`,
      title: formData.title,
      url: formattedUrl,
      category: formData.category || 'Geral'
    };

    if (editingLink) {
      onChange(links.map(l => l.id === editingLink.id ? newLink : l));
    } else {
      onChange([...links, newLink]);
    }

    handleCloseModal();
  };

  const handleEdit = (link: ProfessionalLink) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      category: link.category
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Remover este site da sua lista?")) {
      onChange(links.filter(l => l.id !== id));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
    setFormData({ title: '', url: '', category: 'Geral' });
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por nome, site ou categoria..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={18} />}>
          Adicionar Novo Site
        </Button>
      </div>

      {/* Links Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredLinks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <Globe size={64} className="mb-4" />
            <p className="text-lg font-medium">Nenhum site encontrado</p>
            <p className="text-sm">Comece adicionando seus links profissionais favoritos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
            {filteredLinks.map(link => (
              <div 
                key={link.id}
                className="group bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden shadow-inner">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=64`} 
                      alt="" 
                      className="w-8 h-8 object-contain"
                      onError={(e) => { (e.target as any).src = 'https://www.google.com/s2/favicons?domain=google.com&sz=64' }}
                    />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(link)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(link.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 line-clamp-1 mb-1">{link.title}</h4>
                  <p className="text-xs text-slate-400 truncate mb-3">{link.url.replace(/^https?:\/\//, '')}</p>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider">
                    <Tag size={10} />
                    {link.category}
                  </span>
                </div>

                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 w-full py-2 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
                >
                  Acessar Agora
                  <ExternalLink size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-6 text-white">
              <h3 className="text-xl font-black uppercase tracking-tighter">
                {editingLink ? 'Editar Site' : 'Novo Recurso'}
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome do Site</label>
                <input 
                  autoFocus
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  placeholder="Ex: Google Agenda"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Endereço (URL)</label>
                <input 
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  placeholder="exemplo.com.br"
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoria</label>
                <input 
                  list="cats"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  placeholder="Ex: Produtividade, Bancos, Social"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                />
                <datalist id="cats">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 transition-all"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
