'use client';

import { generateUUID } from '../uuid';
import React, { useState, useMemo } from 'react';
import { Phone, Plus, Search, Trash2, Edit2, Copy } from 'lucide-react';
import { Extension } from '@/types';
import { Button } from '@/components/ui/Button';

interface ExtensionsDirectoryProps {
  extensions: Extension[];
  onChange: (extensions: Extension[]) => void;
}

export const ExtensionsDirectory: React.FC<ExtensionsDirectoryProps> = ({ extensions = [], onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExtension, setEditingExtension] = useState<Extension | null>(null);
  const [formData, setFormData] = useState<Partial<Extension>>({
    name: '',
    department: 'Geral',
    number: '',
    notes: ''
  });

  const departments = useMemo(() => Array.from(new Set(extensions.map(e => e.department))).filter(Boolean), [extensions]);

  const filteredExtensions = extensions.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.number.includes(searchTerm)
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.number) return;

    const newExtension: Extension = {
      id: editingExtension?.id || generateUUID(),
      name: formData.name || '',
      department: formData.department || 'Geral',
      number: formData.number || '',
      notes: formData.notes || ''
    };

    if (editingExtension) {
      onChange(extensions.map(e => e.id === editingExtension.id ? newExtension : e));
    } else {
      onChange([...extensions, newExtension]);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExtension(null);
    setFormData({ name: '', department: 'Geral', number: '', notes: '' });
  };

  const copyToClipboard = (num: string) => {
    navigator.clipboard.writeText(num);
    alert('Ramal copiado!');
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top Bar - Local Search & Add */}
      <div className="flex justify-between items-center bg-win95-bg p-2 win95-raised gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 text-win95-shadow" size={14} />
          <input
            type="text"
            placeholder="Pesquisar nos ramais internos (nome, setor ou número)..."
            className="w-full pl-8 pr-3 py-1.5 win95-sunken text-xs outline-none focus:bg-yellow-50 text-black"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)} icon={<Plus size={14} />}>
          ADICIONAR RAMAL
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Directory Table - Expanded to full width */}
        <div className="flex-1 win95-sunken bg-white overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-win95-bg z-10 border-b-2 border-win95-shadow">
              <tr>
                <th className="px-4 py-2 font-bold uppercase text-palette-darkest/60 border-r border-palette-mediumLight w-1/3">Nome / Colaborador</th>
                <th className="px-4 py-2 font-bold uppercase text-palette-darkest/60 border-r border-palette-mediumLight w-1/4">Departamento</th>
                <th className="px-4 py-2 font-bold uppercase text-palette-darkest/60 border-r border-palette-mediumLight w-1/4">Ramal / Telefone</th>
                <th className="px-4 py-2 font-bold uppercase text-palette-darkest/60 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExtensions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-win95-shadow italic">
                    <div className="flex flex-col items-center gap-2">
                      <Phone size={24} className="opacity-20" />
                      <span>Nenhum ramal interno encontrado.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExtensions.map(ext => (
                  <tr key={ext.id} className="hover:bg-palette-mediumLight/40 group transition-colors">
                    <td className="px-4 py-2 font-bold text-black border-r border-gray-50">{ext.name}</td>
                    <td className="px-4 py-2 text-win95-shadow border-r border-gray-50">
                      <span className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded-sm text-[10px] uppercase font-semibold">
                        {ext.department}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-palette-darkest font-bold border-r border-palette-lightest text-sm tracking-wider">
                      {ext.number}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyToClipboard(ext.number)} className="p-1 win95-raised bg-win95-bg hover:bg-white" title="Copiar Número"><Copy size={12} /></button>
                        <button onClick={() => { setEditingExtension(ext); setFormData(ext); setIsModalOpen(true); }} className="p-1 win95-raised bg-win95-bg hover:bg-white" title="Editar Registro"><Edit2 size={12} /></button>
                        <button onClick={() => confirm('Excluir este ramal permanentemente?') && onChange(extensions.filter(e => e.id !== ext.id))} className="p-1 win95-raised bg-win95-bg hover:bg-red-100 text-red-600" title="Excluir Registro"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <div className="bg-win95-bg w-full max-w-sm win95-raised p-1 shadow-2xl">
            <div className="bg-palette-darkest text-palette-lightest px-2 py-1 text-sm font-bold flex justify-between items-center mb-2 select-none">
              <span>{editingExtension ? 'Modificar Ramal' : 'Novo Ramal Interno'}</span>
              <button onClick={handleCloseModal} className="win95-raised bg-win95-bg text-black w-5 h-5 flex items-center justify-center text-xs font-bold active:shadow-none">×</button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-black block mb-1">Nome / Identificação</label>
                <input required className="w-full px-2 py-1 win95-sunken text-sm outline-none bg-white text-black" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} autoFocus placeholder="Nome do colaborador ou setor" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-black block mb-1">Departamento</label>
                  <input list="depts" className="w-full px-2 py-1 win95-sunken text-sm outline-none bg-white text-black" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} placeholder="TI, RH, etc." />
                  <datalist id="depts">{departments.map(d => <option key={d} value={d} />)}</datalist>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-black block mb-1">Ramal / Número</label>
                  <input required className="w-full px-2 py-1 win95-sunken text-sm font-mono outline-none bg-white text-black font-bold" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} placeholder="1234" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-black block mb-1">Notas (Opcional)</label>
                <textarea className="w-full px-2 py-1 win95-sunken text-sm outline-none resize-none bg-white text-black" rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Ex: Atendimento das 08h às 18h" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" onClick={handleCloseModal} className="flex-1">CANCELAR</Button>
                <Button type="submit" className="flex-1 bg-palette-darkest text-white">GRAVAR DADOS</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
