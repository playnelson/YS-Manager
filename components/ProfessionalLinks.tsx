
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
  const [formData, setFormData] = useState({ title: '', url: '', category: 'Geral' });

  const categories = useMemo(() => Array.from(new Set(links.map(l => l.category))), [links]);

  const filteredLinks = links.filter(link => 
    link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;
    let url = formData.url.trim();
    if (!url.startsWith('http')) url = `https://${url}`;

    const newLink = { id: editingLink?.id || `link_${Date.now()}`, ...formData, url };
    if (editingLink) onChange(links.map(l => l.id === editingLink.id ? newLink : l));
    else onChange([...links, newLink]);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
    setFormData({ title: '', url: '', category: 'Geral' });
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center bg-[#f8f9fa] p-3 border rounded border-[#dee2e6]">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 text-[#556b82]" size={14} />
          <input 
            type="text"
            placeholder="Filtrar diretório..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#dee2e6] rounded text-xs outline-none focus:border-[#0064d2]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)} icon={<Plus size={14} />}>
          NOVO RECURSO
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white border border-[#dee2e6] rounded-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f1f4f6] text-[#556b82] font-bold uppercase border-b border-[#dee2e6]">
              <tr>
                <th className="px-4 py-3 w-10 text-center">Icon</th>
                <th className="px-4 py-3">Descrição / Nome</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {filteredLinks.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-[#556b82] italic">Nenhum registro encontrado no sistema.</td></tr>
              ) : (
                filteredLinks.map(link => (
                  <tr key={link.id} className="hover:bg-[#f8fbff] transition-colors group">
                    <td className="px-4 py-2">
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`} 
                        className="w-5 h-5 mx-auto grayscale group-hover:grayscale-0 transition-all"
                        alt=""
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-bold text-[#0064d2]">{link.title}</div>
                      <div className="text-[10px] text-[#556b82] opacity-60 truncate max-w-xs">{link.url}</div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 bg-[#f3f5f8] border border-[#dee2e6] rounded text-[10px] font-bold uppercase text-[#556b82]">
                        {link.category}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                        <a href={link.url} target="_blank" className="p-1.5 hover:bg-[#eef4ff] text-[#0064d2] rounded"><ExternalLink size={14} /></a>
                        <button onClick={() => { setEditingLink(link); setFormData(link); setIsModalOpen(true); }} className="p-1.5 hover:bg-[#eef4ff] text-[#556b82] rounded"><Edit2 size={14} /></button>
                        <button onClick={() => confirm('Excluir?') && onChange(links.filter(l => l.id !== link.id))} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded border border-[#dee2e6] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-[#f8f9fa] p-4 border-b border-[#dee2e6] flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-[#1c2d3d]">{editingLink ? 'Modificar Registro' : 'Cadastrar Link'}</h3>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#556b82]">Identificação</label>
                <input required className="w-full px-3 py-1.5 bg-white border border-[#dee2e6] rounded text-sm outline-none focus:border-[#0064d2]" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#556b82]">Endereço Web</label>
                <input required className="w-full px-3 py-1.5 bg-white border border-[#dee2e6] rounded text-sm outline-none focus:border-[#0064d2]" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#556b82]">Grupamento / Categoria</label>
                <input list="cats" className="w-full px-3 py-1.5 bg-white border border-[#dee2e6] rounded text-sm outline-none focus:border-[#0064d2]" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={handleCloseModal}>CANCELAR</Button>
                <Button type="submit" className="flex-1">GRAVAR DADOS</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};