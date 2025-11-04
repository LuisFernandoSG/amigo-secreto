import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Loader } from '../components/Loader.jsx';
import { TextField } from '../components/TextField.jsx';
import { WishlistItem } from '../components/WishlistItem.jsx';
import { useGroupsApi } from '../services/groups.js';
import { buildAmazonImageFromAsin, extractAsin } from '../utils/amazon.js';

export const ParticipantPage = () => {
  const { code, participantId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const groupsApi = useGroupsApi();

  const [group, setGroup] = useState(null);
  const [participant, setParticipant] = useState(location.state?.participant ?? null);
  const [assignment, setAssignment] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ defaultValues: { title: '', url: '', note: '' } });

  const loadData = async () => {
    setStatus('pending');
    setMessage(null);
    try {
      const [groupData, participantData] = await Promise.all([
        groupsApi.getGroup(code),
        groupsApi.getParticipant(code, participantId)
      ]);
      setGroup(groupData);
      setParticipant(participantData);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setMessage(error.message ?? 'No pudimos cargar la información.');
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, participantId]);

  const onAddWishlistItem = async (values) => {
    try {
      const asin = extractAsin(values.url);
      const wishlist = await groupsApi.addWishlistItem(code, participantId, {
        ...values,
        imageUrl: buildAmazonImageFromAsin(asin)
      });
      setParticipant((prev) => ({ ...prev, wishlist }));
      reset();
      setMessage('Agregamos tu deseo navideño ✨');
    } catch (error) {
      setMessage(error.message ?? 'No se pudo agregar el artículo.');
    }
  };

  const onRemoveWishlistItem = async (itemId) => {
    try {
      const wishlist = await groupsApi.removeWishlistItem(code, participantId, itemId);
      setParticipant((prev) => ({ ...prev, wishlist }));
    } catch (error) {
      setMessage(error.message ?? 'No se pudo quitar el artículo');
    }
  };

  const onReveal = async () => {
    try {
      const result = await groupsApi.getAssignment(code, participantId);
      setAssignment(result);
      setMessage('¡Sorpresa revelada! Revisa su lista de deseos para inspirarte.');
    } catch (error) {
      setMessage(error.message ?? 'Aún no puedes ver a tu amigo secreto.');
    }
  };

  if (status === 'pending') {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader label="Cargando tu panel…" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <EmptyState
        title="No encontramos tus datos"
        message={message ?? 'Verifica el enlace o solicita un nuevo acceso al organizador.'}
        icon="🎁"
      />
    );
  }

  if (!group || !participant) {
    return null;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="flex flex-col gap-6">
        <Card title={`Hola, ${participant.name}`} description={`Grupo ${group.name}`}>
          <p className="text-sm text-slate-300">
            Este es tu espacio personal. Agrega ideas de regalo para que tu amigo secreto acierte con algo que ames. Cuando el organizador lo permita, podrás descubrir a quién te toca sorprender.
          </p>
          <div className="rounded-xl bg-black/30 p-4 text-sm text-slate-200">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-brand-200">Estado del grupo</span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-base font-semibold text-white">
                  {group.assignmentsGenerated ? 'Emparejamientos listos' : 'Esperando al organizador'}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  {group.allowReveal ? 'Revelación activa' : 'Revelación bloqueada'}
                </span>
              </div>
            </div>
            <Button
              className="mt-4 w-full sm:w-auto"
              onClick={onReveal}
              disabled={!group.assignmentsGenerated || !group.allowReveal}
            >
              Ver a quién debo regalar
            </Button>
            {assignment ? (
              <div className="mt-4 space-y-2 rounded-lg border border-brand-400/30 bg-brand-500/10 p-4">
                <p className="text-sm text-brand-100">Te tocó sorprender a:</p>
                <p className="text-xl font-semibold text-white">{assignment.name}</p>
                {assignment.email ? <p className="text-sm text-slate-200">{assignment.email}</p> : null}
                {assignment.wishlist?.length ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs uppercase tracking-widest text-brand-200">Sus deseos</p>
                    <ul className="grid gap-3">
                      {assignment.wishlist.map((item) => (
                        <li key={item._id}>
                          <WishlistItem item={item} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Aún no tiene deseos publicados, pregúntale por pistas 👀</p>
                )}
              </div>
            ) : null}
          </div>
          {message ? <p className="text-xs text-brand-200">{message}</p> : null}
        </Card>
        <Card title="Tu lista de deseos" description="Añade productos de Amazon que te encantaría recibir.">
          {participant.wishlist?.length ? (
            <ul className="grid gap-3">
              {participant.wishlist.map((item) => (
                <li key={item._id}>
                  <WishlistItem item={item} onRemove={onRemoveWishlistItem} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Sin deseos" message="Comparte algunos enlaces para inspirar a tu amigo secreto." icon="✨" />
          )}
        </Card>
      </div>
      <div className="flex flex-col gap-6">
        <Card title="Agregar un producto">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onAddWishlistItem)}>
            <TextField
              label="Nombre del producto"
              placeholder="Set de tazas navideñas"
              error={errors.title?.message}
              {...register('title', {
                required: 'Describe el producto',
                minLength: { value: 3, message: 'Muy corto' }
              })}
            />
            <TextField
              label="Enlace de Amazon"
              placeholder="https://www.amazon.com/dp/..."
              error={errors.url?.message}
              {...register('url', {
                required: 'Agrega el enlace del producto',
                pattern: { value: /^https?:\/\//i, message: 'Incluye el protocolo https://' }
              })}
            />
            <TextField
              label="Notas (opcional)"
              placeholder="Talla M, color verde"
              error={errors.note?.message}
              {...register('note', { maxLength: { value: 120, message: 'Máximo 120 caracteres' } })}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader label="Guardando…" /> : 'Agregar a mi lista'}
            </Button>
          </form>
          <p className="mt-4 text-xs text-slate-400">
            Tip: copia el enlace directo del producto en Amazon. Detectamos el ASIN automáticamente para mostrar una vista previa.
          </p>
        </Card>
        <Card title="Volver al panel del grupo">
          <Button variant="secondary" onClick={() => navigate(`/grupos/${code}`)}>
            Ver participantes
          </Button>
        </Card>
      </div>
    </div>
  );
};
