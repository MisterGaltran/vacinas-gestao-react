import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChildren } from '../hooks/useChildren';
import { useChildMembers } from '../hooks/useChildMembers';
import { useVaccines } from '../hooks/useVaccines';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { resizeImage } from '../lib/imageResize';

function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const today = new Date();
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
  if (months < 12) return `${months} meses`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths > 0 ? `${years}a ${remainingMonths}m` : `${years} anos`;
}

export function ChildProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { children, loading: childrenLoading, updateChild, removeChild } = useChildren(user);
  const child = children.find((c) => c.id === id) || null;
  const { vaccines } = useVaccines(child);
  const { members, addMember, removeMember } = useChildMembers(child?.id);

  const isOwner = !!(user && child && child.family_id === user.id);

  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sharing form
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [parentalEmail, setParentalEmail] = useState('');
  const [maternity, setMaternity] = useState('');
  const [cpf, setCpf] = useState('');

  // Photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (child) {
      setName(child.name);
      setBirthDate(child.birth_date);
      setPhotoUrl(child.photo_url || '');
      setParentalEmail(child.parental_email || '');
      setMaternity(child.maternity || '');
      setCpf(child.cpf || '');
    }
  }, [child]);

  if (childrenLoading) {
    return (
      <Layout title="Carregando..." onBack={() => navigate('/')}>
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!child) {
    return (
      <Layout title="Não encontrado" onBack={() => navigate('/')}>
        <div className="text-center py-20">
          <span className="text-5xl block mb-4">🔍</span>
          <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
            Criança não encontrada
          </h2>
        </div>
      </Layout>
    );
  }

  const takenCount = vaccines.filter((v) => v.calculated_status === 'taken').length;
  const lateCount = vaccines.filter((v) => v.calculated_status === 'late').length;
  const upcomingCount = vaccines.filter((v) => v.calculated_status === 'upcoming').length;
  const totalCount = vaccines.length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!child || !name || !birthDate) return;

    const { error: updateError } = await updateChild(child.id, {
      name,
      birth_date: birthDate,
      photo_url: photoUrl || null,
      parental_email: parentalEmail || null,
      maternity: maternity || null,
      cpf: cpf || null,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Perfil atualizado com sucesso!');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleDelete = async () => {
    if (!child) return;
    const { error: delError } = await removeChild(child.id);
    if (delError) {
      setError(delError.message);
    } else {
      navigate('/');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !child) return;

    setUploadingPhoto(true);
    try {
      // Redimensiona no browser antes de mandar pro Storage. Foto típica de
      // celular tem 3-5 MB; resultado fica ~50-150 KB sem perda visual.
      const { blob } = await resizeImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85,
        mimeType: 'image/jpeg',
      });

      const fileName = `child-${child.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('child-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '31536000', // 1 ano: o nome é único, sempre seguro
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('child-photos')
        .getPublicUrl(fileName);

      const publicUrl = urlData?.publicUrl;
      if (publicUrl) {
        setPhotoUrl(publicUrl);
        await updateChild(child.id, { photo_url: publicUrl });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload da foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <Layout
      title={child.name}
      onLogout={signOut}
      onBack={() => navigate('/')}
    >
      {/* Toast */}
      {error && (
        <div className="fixed top-20 right-4 z-50 max-w-sm animate-scale-in">
          <div className="bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-2xl px-4 py-3 flex items-start gap-3 shadow-lg">
            <span className="text-lg shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-danger-700 dark:text-danger-400">Erro</p>
              <p className="text-xs text-danger-600 dark:text-danger-300 mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-danger-400 hover:text-danger-600 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-20 right-4 z-50 max-w-sm animate-scale-in">
          <div className="bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20 rounded-2xl px-4 py-3 flex items-start gap-3 shadow-lg">
            <span className="text-lg shrink-0">✅</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-success-700 dark:text-success-400">Sucesso</p>
              <p className="text-xs text-success-600 dark:text-success-300 mt-0.5">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header com foto e nome */}
      <div className="card-premium mb-6 animate-fade-in-up">
        <div className="flex items-start gap-5">
          {/* Foto */}
          <div className="relative shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={child.name}
                decoding="async"
                width={96}
                height={96}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white dark:border-gray-700 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-4xl shadow-lg">
                👶
              </div>
            )}
            {editing && (
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-white dark:bg-gray-800 rounded-xl border-2 border-border-light dark:border-border-dark flex items-center justify-center cursor-pointer shadow-md hover:shadow-lg transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                {uploadingPhoto ? (
                  <div className="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full" />
                ) : (
                  <svg className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </label>
            )}
          </div>

          {/* Info básica */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark truncate">
              {child.name}
            </h1>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
              🎂 {new Date(child.birth_date).toLocaleDateString('pt-BR')} · {calculateAge(child.birth_date)}
            </p>
            {child.maternity && (
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                🏥 {child.maternity}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              {!editing && (
                <button onClick={() => setEditing(true)} className="btn-ghost text-primary-600 dark:text-primary-400 text-sm font-semibold">
                  <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() => setShowDelete(true)}
                  className="btn-ghost text-danger-500 hover:text-danger-600 text-sm font-semibold"
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Excluir
                </button>
              )}
              {!isOwner && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-accent-400/15 dark:bg-accent-400/20 text-accent-600 dark:text-accent-400 border border-accent-400/30">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Compartilhado com você
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card-stat border-t-[3px] border-t-primary-400">
          <div className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark tabular-nums">{totalCount}</div>
          <p className="text-[10px] font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Total de Vacinas</p>
        </div>
        <div className="card-stat border-t-[3px] border-t-success-500">
          <div className="text-2xl font-extrabold text-success-600 dark:text-green-400 tabular-nums">{takenCount}</div>
          <p className="text-[10px] font-semibold text-success-600 dark:text-green-400 uppercase tracking-wider">✅ Tomadas</p>
        </div>
        <div className="card-stat border-t-[3px] border-t-danger-500">
          <div className="text-2xl font-extrabold text-danger-600 dark:text-red-400 tabular-nums">{lateCount}</div>
          <p className="text-[10px] font-semibold text-danger-600 dark:text-red-400 uppercase tracking-wider">🔴 Atrasadas</p>
        </div>
        <div className="card-stat border-t-[3px] border-t-primary-400">
          <div className="text-2xl font-extrabold text-primary-600 dark:text-blue-400 tabular-nums">{upcomingCount}</div>
          <p className="text-[10px] font-semibold text-primary-600 dark:text-blue-400 uppercase tracking-wider">🔜 Próximas</p>
        </div>
      </div>

      {/* Barra de progresso */}
      {totalCount > 0 && (
        <div className="card-premium mb-6 !p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">Cobertura Vacinal</span>
            <span className="text-xs font-bold text-success-600 dark:text-green-400">{Math.round((takenCount / totalCount) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-success-400 to-success-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(takenCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Formulário de edição */}
      {editing && (
        <form onSubmit={handleSave} className="card-premium mb-6 animate-scale-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shadow-md">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">Editar Informações</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">Nome completo</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-premium" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">Data de Nascimento</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required className="input-premium" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">URL da Foto</label>
              <input type="text" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className="input-premium" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">E-mail dos Pais</label>
              <input type="email" value={parentalEmail} onChange={(e) => setParentalEmail(e.target.value)} className="input-premium" placeholder="pais@email.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">Maternidade / Hospital</label>
              <input type="text" value={maternity} onChange={(e) => setMaternity(e.target.value)} className="input-premium" placeholder="Ex: Maternidade Santa Joana" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-1.5">CPF</label>
              <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} className="input-premium" placeholder="000.000.000-00" />
            </div>
          </div>

          <div className="flex gap-2 mt-5 pt-4 border-t border-border-light dark:border-border-dark">
            <button type="submit" className="btn-primary">Salvar Alterações</button>
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      {/* Campos extras (visualização) */}
      {!editing && (
        <div className="card-premium mb-6 animate-fade-in-up">
          <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-text-muted-light dark:text-text-muted-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
            Informações Adicionais
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">📧 E-mail dos Pais</p>
              <p className="text-sm text-text-primary-light dark:text-text-primary-dark mt-0.5 truncate">
                {child.parental_email || 'Não informado'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">🏥 Maternidade</p>
              <p className="text-sm text-text-primary-light dark:text-text-primary-dark mt-0.5 truncate">
                {child.maternity || 'Não informado'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 sm:col-span-2">
              <p className="text-[10px] font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">📋 CPF</p>
              <p className="text-sm text-text-primary-light dark:text-text-primary-dark mt-0.5">
                {child.cpf || 'Não informado'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compartilhamento */}
      <div className="card-premium mb-6 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white shadow-md">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
              Compartilhar com a família
            </h3>
            <p className="text-[11px] text-text-muted-light dark:text-text-muted-dark mt-0.5">
              {isOwner
                ? 'Adicione e-mails de outras pessoas para acompanharem juntas'
                : 'Apenas o dono pode adicionar ou remover acessos'}
            </p>
          </div>
        </div>

        {/* Lista de membros */}
        <div className="space-y-2 mb-4">
          {members.length === 0 && (
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark italic px-2 py-3 text-center">
              Ninguém ainda. {isOwner ? 'Adicione um e-mail abaixo.' : ''}
            </p>
          )}
          {members.map((m) => {
            const isCurrentUser = user?.email?.toLowerCase() === m.user_email;
            return (
              <div
                key={m.user_email}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                  m.role === 'owner'
                    ? 'bg-gradient-to-br from-primary-500 to-accent-500'
                    : 'bg-gradient-to-br from-success-400 to-success-600'
                }`}>
                  {m.user_email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                    {m.user_email}
                    {isCurrentUser && (
                      <span className="ml-1.5 text-[10px] text-text-muted-light dark:text-text-muted-dark">(você)</span>
                    )}
                  </p>
                  <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${
                    m.role === 'owner'
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-success-600 dark:text-green-400'
                  }`}>
                    {m.role === 'owner' ? '👑 Dono' : '✏️ Editor'}
                  </span>
                </div>
                {isOwner && m.role !== 'owner' && (
                  <button
                    onClick={async () => {
                      const { error: rmError } = await removeMember(m.user_email);
                      if (rmError) setError(rmError.message);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-500/10 hover:text-danger-600 transition-all"
                    title="Remover acesso"
                    aria-label="Remover acesso"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Form: adicionar membro (só dono) */}
        {isOwner && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newMemberEmail.trim() || addingMember) return;
              setAddingMember(true);
              const { error: addError } = await addMember(newMemberEmail);
              if (addError) {
                setError(addError.message);
              } else {
                setSuccess(`Acesso liberado para ${newMemberEmail.toLowerCase()}`);
                setNewMemberEmail('');
                setTimeout(() => setSuccess(''), 3000);
              }
              setAddingMember(false);
            }}
            className="flex gap-2 pt-3 border-t border-border-light dark:border-border-dark"
          >
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="input-premium flex-1 text-xs"
              required
            />
            <button
              type="submit"
              disabled={addingMember || !newMemberEmail.trim()}
              className="btn-primary text-xs !py-2 !px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingMember ? 'Adicionando...' : 'Adicionar'}
            </button>
          </form>
        )}

        {isOwner && (
          <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark mt-3 leading-relaxed">
            💡 A pessoa precisa <strong>criar uma conta</strong> no app com esse mesmo e-mail para que o bebê apareça pra ela.
            Editores podem registrar vacinas e editar o perfil — mas só você pode excluir o bebê.
          </p>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="text-center">
              <span className="text-5xl block mb-4">⚠️</span>
              <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Excluir {child.name}?</h3>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                Esta ação não pode ser desfeita. Todos os dados de vacinas serão permanentemente removidos.
              </p>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={handleDelete} className="flex-1 bg-danger-500 hover:bg-danger-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-md shadow-danger-500/25">
                Sim, excluir
              </button>
              <button onClick={() => setShowDelete(false)} className="flex-1 btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}