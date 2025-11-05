import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card } from '../components/Card.jsx';
import { TextField } from '../components/TextField.jsx';
import { Button } from '../components/Button.jsx';
import { Loader } from '../components/Loader.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { WishlistItem } from '../components/WishlistItem.jsx';
import { useGroupsApi } from '../services/groups.js';
import { useRealtimeGroup } from '../hooks/useRealtimeGroup.js';
import {
  forgetGroup,
  getParticipantAccess,
  rememberGroupProfile,
  rememberParticipantAccess,
  rememberParticipantForGroup
} from '../utils/storage.js';
import { extractAsin, buildAmazonImageFromAsin, buildAmazonSearchUrl } from '../utils/amazon.js';

const formatEventDate = (value) => {
  if (!value) return 'A definir';
  try {
    return new Intl.DateTimeFormat('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(value));
  } catch (error) {
    return 'A definir';
  }
};

const formatBudget = (value) => {
  if (value === null || value === undefined) return 'Libre';
  try {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      maximumFractionDigits: 0
    }).format(value);
  } catch (error) {
    return `₡${value}`;
  }
};

export const ParticipantPage = () => {
  const { code = '', participantId = '' } = useParams();
  const joinCode = code.toUpperCase();
  const location = useLocation();
  const navigate = useNavigate();

  const locationAccess = location.state?.accessCode;
  const queryAccess = new URLSearchParams(location.search).get('access');
  const storedAccess = useMemo(() => getParticipantAccess(participantId), [participantId]);
  const initialAccessCode = locationAccess || queryAccess || storedAccess || '';

  const { getParticipant, getAssignment, addWishlistItem, removeWishlistItem } = useGroupsApi();

  const [accessCode, setAccessCode] = useState(initialAccessCode);
  const [accessInput, setAccessInput] = useState(initialAccessCode);
  const [needsAccess, setNeedsAccess] = useState(!initialAccessCode);
  const [accessFeedback, setAccessFeedback] = useState(null);

  const [group, setGroup] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [peers, setPeers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [friendInfo, setFriendInfo] = useState(null);
  const [friendStatus, setFriendStatus] = useState({ loading: false, message: null });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: { title: '', url: '', note: '' }
  });

  const productTitle = watch('title');
  const amazonSearchLink = buildAmazonSearchUrl(productTitle);

  const [wishlistStatus, setWishlistStatus] = useState({ loading: false, message: null });

  const loadParticipant = useCallback(
    async (accessToUse) => {
      const normalized = (accessToUse || accessCode || '').toUpperCase();
      if (!normalized) return;
      setIsLoading(true);
      setAccessFeedback(null);
      try {
        const data = await getParticipant(joinCode, participantId, normalized);
        const groupPayload = data.group
          ? {
              ...data.group,
              eventDate: data.eventDate || null,
              budgetAmount: data.budgetAmount ?? null
            }
          : null;
        setGroup(groupPayload);
        setParticipant(data.participant);
        setPeers(data.peers);
        rememberParticipantAccess(participantId, normalized);
        rememberParticipantForGroup(joinCode, data.participant);
        rememberGroupProfile(joinCode, { name: data.group.name });
        setAccessCode(normalized);
        setAccessInput(normalized);
        setNeedsAccess(false);
      } catch (error) {
        if (error.response?.status === 404) {
          navigate('/404', { replace: true });
          return;
        }
        if (error.response?.status === 403) {
          setNeedsAccess(true);
          setAccessFeedback('El código de acceso no es válido. Revisa el enlace que te compartieron.');
          setGroup(null);
          setParticipant(null);
        } else {
          setAccessFeedback(error.message || 'No pudimos cargar tu información.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [accessCode, getParticipant, joinCode, navigate, participantId]
  );

  useEffect(() => {
    if (initialAccessCode) {
      loadParticipant(initialAccessCode);
    } else {
      setNeedsAccess(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRealtimeEvent = useCallback(
    (message) => {
      if (!message?.event) return;
      if (message.event === 'group:deleted') {
        setGroup(null);
        setParticipant(null);
        setPeers([]);
        forgetGroup(joinCode);
        navigate('/', {
          replace: true,
          state: { message: 'La sala se cerró. Consulta con el anfitrión para crear una nueva.' }
        });
        return;
      }
      if (!needsAccess) {
        loadParticipant();
      }
    },
    [joinCode, loadParticipant, navigate, needsAccess]
  );

  useRealtimeGroup(joinCode, handleRealtimeEvent);

  const handleAccessSubmit = (event) => {
    event.preventDefault();
    const normalized = accessInput.trim().toUpperCase();
    if (!normalized) {
      setAccessFeedback('Escribe el código que recibiste por mensaje.');
      return;
    }
    loadParticipant(normalized);
  };

  const handleAddWishlistItem = handleSubmit(async (values) => {
    if (!accessCode) return;
    setWishlistStatus({ loading: true, message: null });
    try {
      const asin = extractAsin(values.url.trim());
      console.log('ASIN', asin);  
      // const imageUrl = asin ? buildAmazonImageFromAsin(asin) : undefined;
      const payload = {
        title: values.title.trim(),
        url: values.url.trim(),
        note: values.note.trim(),
        imageUrl
      };
      const wishlist = await addWishlistItem(joinCode, participantId, accessCode, payload);
      setParticipant((prev) => (prev ? { ...prev, wishlist } : prev));
      setWishlistStatus({ loading: false, message: 'Agregamos tu deseo a la lista. ✨' });
      reset();
    } catch (error) {
      setWishlistStatus({ loading: false, message: error.message || 'No pudimos guardar el producto.' });
    }
  });

  const handleRemoveWishlistItem = async (itemId) => {
    if (!accessCode) return;
    setWishlistStatus({ loading: true, message: null });
    try {
      const wishlist = await removeWishlistItem(joinCode, participantId, accessCode, itemId);
      setParticipant((prev) => (prev ? { ...prev, wishlist } : prev));
      setWishlistStatus({ loading: false, message: 'Elemento eliminado.' });
    } catch (error) {
      setWishlistStatus({ loading: false, message: error.message || 'No pudimos quitar el producto.' });
    }
  };

  const handleRevealFriend = async () => {
    if (!accessCode) return;
    setFriendStatus({ loading: true, message: null });
    try {
      const data = await getAssignment(joinCode, participantId, accessCode);
      setFriendInfo(data.friend);
      setFriendStatus({ loading: false, message: '¡Recuerda mantener la sorpresa!' });
    } catch (error) {
      setFriendInfo(null);
      if (error.response?.status === 403) {
        setFriendStatus({ loading: false, message: 'Aún no está permitido revelar. Pregunta a quien creó el grupo.' });
      } else if (error.response?.status === 409) {
        setFriendStatus({ loading: false, message: 'Todavía no se han generado las asignaciones.' });
      } else {
        setFriendStatus({ loading: false, message: error.message || 'No pudimos revelar a tu amigo secreto.' });
      }
    }
  };

  const handleCopyPersonalLink = async () => {
    if (!accessCode) return;
    const personalUrl = `${window.location.origin}/grupos/${joinCode}/participantes/${participantId}?access=${accessCode}`;
    try {
      await navigator.clipboard.writeText(personalUrl);
      setWishlistStatus({ loading: false, message: 'Enlace personal copiado. Guárdalo en tus notas.' });
    } catch (error) {
      setWishlistStatus({ loading: false, message: 'Copia manualmente tu enlace: ' + personalUrl });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {needsAccess ? (
        <Card
          title="Ingresa tu código privado"
          description="Lo recibiste al unirte. Guárdalo porque es la llave para tu lista personal."
        >
          <form className="flex flex-col gap-3" onSubmit={handleAccessSubmit}>
            <TextField
              label="Código de acceso"
              placeholder="XXXXYYYY"
              value={accessInput}
              onChange={(event) => setAccessInput(event.target.value.toUpperCase())}
            />
            <Button type="submit" variant="secondary">
              Ver mi intercambio
            </Button>
            {accessFeedback ? <p className="text-xs text-berry-600">{accessFeedback}</p> : null}
          </form>
        </Card>
      ) : null}

      {isLoading ? <Loader label="Cargando tu información…" /> : null}

      {!isLoading && participant && group ? (
        <>
          <Card
            title={`¡Hola, ${participant.name}!`}
            description={`Estás participando en ${group.name}. Todo se sincroniza automáticamente.`}
          >
            <div className="flex flex-col gap-4 text-sm text-moss-600">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-holly-100 bg-holly-50/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-moss-500">Código del grupo</p>
                  <p className="text-base font-semibold text-moss-900">{group.joinCode}</p>
                </div>
                <div className="rounded-2xl border border-berry-100 bg-berry-50/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-moss-500">Fecha del encuentro</p>
                  <p className="text-base font-semibold text-moss-900">{formatEventDate(group.eventDate)}</p>
                </div>
                <div className="rounded-2xl border border-snow-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-moss-500">Presupuesto sugerido</p>
                  <p className="text-base font-semibold text-moss-900">{formatBudget(group.budgetAmount)}</p>
                </div>
                <div className="rounded-2xl border border-holly-100 bg-holly-50/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-moss-500">Emparejamiento listo</p>
                  <p className="text-base font-semibold text-moss-900">{group.assignmentsGenerated ? 'Sí' : 'Aún no'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-snow-200 bg-white p-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-moss-500">Revelaciones activas</p>
                  <p className="text-base font-semibold text-moss-900">{group.allowReveal ? 'Sí' : 'Aún no'}</p>
                </div>
                {/* <Button variant="subtle" onClick={handleCopyPersonalLink} className="text-xs uppercase tracking-wide">
                  Copiar mi enlace
                </Button> */}
              </div>
              {/* <p className="text-xs text-moss-500">
                Las actualizaciones se reflejan solitas cuando alguien agrega o modifica su lista.
              </p> */}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
            <div className="flex flex-col gap-8">
                      <Card
                title="Tu amigo secreto"
                description="La magia se mantiene en secreto hasta que el anfitrión lo autorice."
              >
                <div className="flex flex-col gap-3">
                  <Button variant="secondary" onClick={handleRevealFriend} disabled={friendStatus.loading}>
                    {friendStatus.loading ? <Loader label="Buscando…" /> : 'Revelar a quién regalo'}
                  </Button>
                  {friendStatus.message ? <p className="text-xs text-holly-700">{friendStatus.message}</p> : null}
                  {friendInfo ? (
                    <div className="rounded-2xl border border-snow-200 bg-white p-4">
                      <h3 className="text-base font-semibold text-moss-900">{friendInfo.name}</h3>
                      {friendInfo.wishlist.length ? (
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-moss-700">
                          {friendInfo.wishlist.map((item) => (
                            <li key={item.id}>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-berry-600 hover:text-berry-700"
                              >
                                {item.title}
                              </a>
                              {item.note ? <span className="ml-2 text-moss-500">— {item.note}</span> : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-moss-600">Tu amigo secreto aún no tiene deseos registrados.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              </Card>

              <Card
                title="Tu lista de deseos"
                description="Añade productos desde Amazon o cualquier tienda. Solo tú la editas."
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-snow-200 bg-snow-50/70 p-3 text-xs text-moss-500 sm:flex-row sm:items-center">
                    <span>¿Buscas ideas? Abre Amazon con lo que escribiste o pega cualquier enlace.</span>
                    <Button
                      as="a"
                      href={amazonSearchLink}
                      target="_blank"
                      rel="noreferrer"
                      variant="subtle"
                      className="text-xs"
                    >
                      Buscar en Amazon ↗
                    </Button>
                  </div>
                  <form className="flex flex-col gap-3" onSubmit={handleAddWishlistItem}>
                    <TextField
                      label="Nombre del producto"
                      placeholder="Set de tazas navideñas"
                      {...register('title', { required: 'Ingresa un título' })}
                      error={errors.title?.message}
                    />
                    <TextField
                      label="Enlace"
                      placeholder="https://www.amazon.com/..."
                      type="url"
                      helperText="Si el enlace no es de Amazon mostraremos solo el título y tu nota."
                      {...register('url', { required: 'Comparte un enlace para encontrar el regalo' })}
                      error={errors.url?.message}
                    />
                    <TextField
                      label="Notas (opcional)"
                      placeholder="Color verde oscuro, por favor"
                      {...register('note')}
                    />
                    <div className="flex flex-col gap-2">
                      <Button type="submit" disabled={wishlistStatus.loading}>
                        {wishlistStatus.loading ? <Loader label="Guardando…" /> : 'Agregar a mi lista'}
                      </Button>
                      {wishlistStatus.message ? (
                        <p className="text-xs text-holly-700">{wishlistStatus.message}</p>
                      ) : null}
                    </div>
                  </form>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  {participant.wishlist.length ? (
                    participant.wishlist.map((item) => (
                      <WishlistItem key={item.id} item={item} onRemove={handleRemoveWishlistItem} />
                    ))
                  ) : (
                    <EmptyState
                      icon="🎁"
                      title="Tu lista está vacía"
                      message="Agrega un par de ideas para que tu amigo secreto acierte."
                    />
                  )}
                </div>
              </Card>


            </div>

            <Card
              title="Listas del grupo"
              description="Solo puedes consultar las ideas de los demás para inspirarte. No se pueden editar."
            >
              {peers.length ? (
                <div className="flex flex-col gap-4">
                  {peers.map((peer) => (
                    <div key={peer.id} className="flex flex-col gap-3 rounded-2xl border border-snow-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-moss-900">{peer.name}</h3>
                        {peer.isOwner ? <span className="text-xs uppercase tracking-wide text-holly-600">Anfitrión</span> : null}
                      </div>
                      {peer.wishlist.length ? (
                        <ul className="list-disc space-y-2 pl-5 text-sm text-moss-700">
                          {peer.wishlist.map((item) => (
                            <li key={item.id}>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-berry-600 hover:text-berry-700"
                              >
                                {item.title}
                              </a>
                              {item.note ? <span className="ml-2 text-moss-500">— {item.note}</span> : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-moss-500">Aún no agregó deseos.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="🌟"
                  title="Aún no hay deseos publicados"
                  message="Cuando tus compañeros agreguen productos los verás aquí."
                />
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
};