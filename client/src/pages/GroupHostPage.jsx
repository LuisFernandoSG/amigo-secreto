import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Loader } from '../components/Loader.jsx';
import { TextField } from '../components/TextField.jsx';
import { useGroupsApi } from '../services/groups.js';

const formatDate = (date) => new Date(date).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });

export const GroupHostPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const groupsApi = useGroupsApi();
  const [group, setGroup] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ defaultValues: { name: '', email: '' } });

  const loadGroup = async () => {
    setStatus('pending');
    setError(null);
    setActionMessage(null);
    try {
      const result = await groupsApi.getGroup(code);
      setGroup(result);
      setStatus('success');
    } catch (err) {
      setError(err.message ?? 'No se pudo cargar el grupo');
      setStatus('error');
    }
  };

  useEffect(() => {
    loadGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const participants = useMemo(() => group?.participants ?? [], [group]);

  const onAddParticipant = async (values) => {
    try {
      const participant = await groupsApi.addParticipant(code, values);
      setGroup((prev) => ({ ...prev, participants: [...(prev?.participants ?? []), participant] }));
      reset();
      setActionMessage(`${participant.name} se unió al intercambio ✨`);
    } catch (err) {
      setActionMessage(err.message ?? 'No se pudo agregar a la persona');
    }
  };

  const onGenerateAssignments = async () => {
    try {
      await groupsApi.generateAssignments(code);
      await loadGroup();
      setActionMessage('Asignaciones generadas. Habilita la revelación cuando quieras.');
    } catch (err) {
      setActionMessage(err.message ?? 'No se pudieron generar las asignaciones');
    }
  };

  const onToggleReveal = async () => {
    try {
      const nextValue = !group?.allowReveal;
      await groupsApi.updateSettings(code, { allowReveal: nextValue });
      setGroup((prev) => ({ ...prev, allowReveal: nextValue }));
      setActionMessage(nextValue ? 'Los participantes ya pueden ver a quién regalar 🎁' : 'La revelación se ha deshabilitado');
    } catch (err) {
      setActionMessage(err.message ?? 'No se pudo actualizar la configuración');
    }
  };

  if (status === 'pending') {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader label="Cargando grupo…" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <EmptyState
        title="Ups, no encontramos el grupo"
        message={error ?? 'Verifica el código e inténtalo de nuevo.'}
        icon="🎄"
      />
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-6">
        <Card title={group.name} description={`Código: ${group.joinCode}`}>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span>
              Creado por <strong>{group.ownerName}</strong>
            </span>
            {group.ownerEmail ? <span>📧 {group.ownerEmail}</span> : null}
            <span>Actualizado {formatDate(group.updatedAt ?? new Date())}</span>
          </div>
          <div className="grid gap-3 rounded-xl bg-black/30 p-4 text-sm text-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <span className="text-base font-semibold text-white">Estado del sorteo</span>
              <span className="text-sm uppercase tracking-widest text-brand-200">
                {group.assignmentsGenerated ? 'Generado' : 'Pendiente'}
              </span>
            </div>
            <p className="text-sm text-slate-300">
              {group.assignmentsGenerated
                ? 'Los emparejamientos están listos. Puedes habilitar la revelación cuando quieras que cada persona descubra a su destinatario.'
                : 'Agrega a todas las personas antes de generar los emparejamientos para garantizar un sorteo justo.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={onGenerateAssignments} disabled={participants.length < 2}>
                Generar emparejamientos
              </Button>
              <Button variant="secondary" onClick={onToggleReveal} disabled={!group.assignmentsGenerated}>
                {group.allowReveal ? 'Deshabilitar revelación' : 'Habilitar revelación'}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/')}>Crear otro grupo</Button>
            </div>
            {actionMessage ? <p className="text-xs text-brand-200">{actionMessage}</p> : null}
          </div>
        </Card>
        <Card title="Personas participantes" description="Comparte el código para que cada quien se registre con sus datos.">
          {participants.length === 0 ? (
            <EmptyState title="Aún no hay participantes" message="Invita a tus amigos y familiares para comenzar." icon="🧑‍🤝‍🧑" />
          ) : (
            <ul className="grid gap-3">
              {participants.map((participant) => (
                <li
                  key={participant._id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm"
                >
                  <div>
                    <p className="text-lg font-semibold text-white">{participant.name}</p>
                    <p className="text-sm text-slate-300">{participant.email ?? 'Sin correo'}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Button
                      variant="ghost"
                      className="text-xs"
                      onClick={() =>
                        navigate(`/grupos/${code}/participantes/${participant._id}`, {
                          state: { participant }
                        })
                      }
                    >
                      Ver panel individual
                    </Button>
                    {participant.wishlist?.length ? (
                      <span className="rounded-full bg-brand-500/20 px-3 py-1 text-brand-100">
                        {participant.wishlist.length} deseos
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <div className="flex flex-col gap-6">
        <Card title="Agregar participante manualmente">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onAddParticipant)}>
            <TextField
              label="Nombre"
              placeholder="Laura"
              error={errors.name?.message}
              {...register('name', { required: 'Ingresa un nombre', minLength: { value: 2, message: 'Demasiado corto' } })}
            />
            <TextField
              label="Correo (opcional)"
              placeholder="correo@ejemplo.com"
              type="email"
              error={errors.email?.message}
              {...register('email', {
                pattern: { value: /\S+@\S+\.\S+/, message: 'Formato inválido' }
              })}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader label="Agregando…" /> : 'Agregar'}
            </Button>
          </form>
        </Card>
        <Card title="Comparte el código">
          <div className="flex flex-col gap-3 text-sm text-slate-300">
            <p>Comparte este enlace para que puedan unirse directamente:</p>
            <code className="break-all rounded-xl bg-black/40 p-3 text-brand-100">
              {`${typeof window !== 'undefined' ? window.location.origin : 'https://tu-dominio.com'}/grupos/${group.joinCode}`}
            </code>
            <p className="text-xs text-slate-500">
              Tip: incluye este enlace en tu grupo de WhatsApp o correo para que nadie se quede fuera.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
