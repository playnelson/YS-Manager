
import React, { useState, useMemo } from 'react';
import { Plus, Globe, ExternalLink, Trash2, Search, Tag, Edit2, Upload, Image as ImageIcon, MoreVertical, X } from 'lucide-react';
import { ProfessionalLink } from '../types';
import { Button } from './ui/Button';

interface ProfessionalLinksProps {
  links: ProfessionalLink[];
  onChange: (links: ProfessionalLink[]) => void;
}

export const ProfessionalLinks: React.FC<ProfessionalLinksProps> = ({ links, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ProfessionalLink | null>(null);

  // Estado do Formulário
  const [formData, setFormData] = useState({ title: '', url: '', category: 'Geral', customIcon: '' });

  const categories = useMemo(() => {
    const cats = new Set(links.map(l => l.category));
    return ['Todas', ...Array.from(cats).sort()];
  }, [links]);

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCategory === 'Todas' || link.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;
    let url = formData.url.trim();
    if (!url.startsWith('http')) url = `https://${url}`;

    const newLink: ProfessionalLink = {
      id: editingLink?.id || `link_${Date.now()}`,
      title: formData.title,
      url: url,
      category: formData.category,
      customIcon: formData.customIcon
    };

    if (editingLink) onChange(links.map(l => l.id === editingLink.id ? newLink : l));
    else onChange([...links, newLink]);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
    setFormData({ title: '', url: '', category: 'Geral', customIcon: '' });
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setFormData(prev => ({ ...prev, customIcon: ev.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Remover este atalho?')) {
      onChange(links.filter(l => l.id !== id));
    }
  };

  const editLink = (link: ProfessionalLink, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      category: link.category,
      customIcon: link.customIcon || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-palette-mediumLight/10">
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-win95-bg p-2 win95-raised shrink-0 gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 text-win95-shadow" size={14} />
            <input
              type="text"
              placeholder="Pesquisar atalho..."
              className="w-full pl-8 pr-3 py-1.5 win95-sunken text-xs outline-none bg-white text-black"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="win95-sunken px-2 py-1.5 text-xs outline-none bg-white text-black font-bold h-full"
            value={activeCategory}
            onChange={e => setActiveCategory(e.target.value)}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)} icon={<Plus size={14} />}>
          NOVO ATALHO
        </Button>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {filteredLinks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 text-[#808080]">
            <Globe size={64} strokeWidth={1} />
            <p className="mt-4 font-black uppercase tracking-widest text-xs">Diretório Vazio</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {filteredLinks.map(link => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col items-center p-3 rounded hover:bg-palette-mediumLight/60 hover:shadow-inner border border-transparent hover:border-palette-mediumDark/50 transition-all relative"
                title={link.url}
              >
                {/* Botões de Ação (Aparecem no Hover) */}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => editLink(link, e)}
                    className="p-1 bg-white shadow-sm rounded-full text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 size={10} />
                  </button>
                  <button
                    onClick={(e) => deleteLink(link.id, e)}
                    className="p-1 bg-white shadow-sm rounded-full text-red-600 hover:text-red-800"
                  >
                    <X size={10} />
                  </button>
                </div>

                {/* Ícone Grande */}
                <div className="w-16 h-16 mb-2 flex items-center justify-center bg-white rounded-xl shadow-sm p-2 group-hover:scale-110 transition-transform">
                  <img
                    src={link.customIcon || `https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=64`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback se o favicon falhar
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                    alt=""
                  />
                  <Globe size={32} className="text-gray-400 hidden" />
                </div>

                {/* Texto */}
                <div className="text-center w-full">
                  <div className="text-xs font-bold text-palette-darkest truncate leading-tight group-hover:text-black group-hover:underline">
                    {link.title}
                  </div>
                  <div className="text-[9px] text-gray-500 truncate mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {new URL(link.url).hostname}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-win95-bg w-full max-w-sm win95-raised p-1 shadow-2xl animate-in zoom-in duration-200">
            <div className="bg-palette-darkest text-white px-2 py-1 text-sm font-bold flex justify-between items-center mb-2">
              <span className="flex items-center gap-2"><Globe size={14} /> {editingLink ? 'Editar Atalho' : 'Novo Atalho'}</span>
              <button onClick={handleCloseModal} className="win95-raised bg-win95-bg text-black w-5 h-5 flex items-center justify-center text-xs font-bold">×</button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-black block mb-1">Nome do Site / Sistema</label>
                <input required className="w-full px-2 py-1.5 win95-sunken text-sm outline-none bg-white text-black" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} autoFocus placeholder="Ex: Portal de Vendas" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-black block mb-1">Endereço Web (URL)</label>
                <input required className="w-full px-2 py-1.5 win95-sunken text-sm outline-none bg-white text-black font-mono" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="www.exemplo.com.br" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-black block mb-1">Categoria</label>
                  <input list="cats" className="w-full px-2 py-1.5 win95-sunken text-sm outline-none bg-white text-black" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                  <datalist id="cats">{categories.filter(c => c !== 'Todas').map(c => <option key={c} value={c} />)}</datalist>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-black block mb-1">Ícone (Opcional)</label>
                  <div className="flex gap-1">
                    <label className="flex-1 win95-raised px-2 py-1.5 text-xs text-center cursor-pointer bg-[#e0e0e0] hover:bg-white flex items-center justify-center gap-1 active:bg-[#ccc]">
                      <Upload size={12} /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
                    </label>
                    {formData.customIcon && (
                      <div className="w-8 h-8 win95-sunken bg-white p-0.5 shrink-0 flex items-center justify-center relative group">
                        <img src={formData.customIcon} className="w-full h-full object-contain" />
                        <button type="button" onClick={() => setFormData(p => ({ ...p, customIcon: '' }))} className="absolute inset-0 bg-red-500/50 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white"><X size={12} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {formData.url && !formData.customIcon && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 text-[10px] text-yellow-800">
                  <img src={`https://www.google.com/s2/favicons?domain=${formData.url.startsWith('http') ? new URL(formData.url).hostname : formData.url}&sz=32`} className="w-4 h-4" onError={(e) => e.currentTarget.style.display = 'none'} />
                  <span>Será usado o ícone padrão do site se nenhum for enviado.</span>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-gray-300">
                <Button type="button" onClick={handleCloseModal} className="flex-1">CANCELAR</Button>
                <Button type="submit" className="flex-1 bg-palette-darkest text-white">SALVAR</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
