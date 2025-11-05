import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card.jsx';
import { TextField } from '../components/TextField.jsx';
import { Button } from '../components/Button.jsx';
import { Loader } from '../components/Loader.jsx';
import { useGroupsApi } from '../services/groups.js';
import {
  getRememberedAdminGroups,
  getRememberedParticipantLinks,
  rememberAdminCode,
  rememberParticipantAccess,
  rememberParticipantForGroup
} from '../utils/storage.js';

export const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createGroup, addParticipant } = useGroupsApi();

  const [infoMessage, setInfoMessage] = useState(location.state?.message || null);
  useEffect(() => {
    if (location.state?.message) {
      setInfoMessage(location.state.message);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const [createFeedback, setCreateFeedback] = useState(null);
  const [joinFeedback, setJoinFeedback] = useState(null);
  const [activePanel, setActivePanel] = useState('create');

  const [savedHosts, setSavedHosts] = useState([]);
  const [savedParticipantLinks, setSavedParticipantLinks] = useState([]);

  const refreshStoredGroups = useCallback(() => {
    setSavedHosts(getRememberedAdminGroups());
    setSavedParticipantLinks(getRememberedParticipantLinks());
  }, []);

  useEffect(() => {
    refreshStoredGroups();
    const handleFocus = () => refreshStoredGroups();
    const handleStorage = () => refreshStoredGroups();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshStoredGroups]);

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    reset: resetCreate
  } = useForm({
    defaultValues: { name: '', ownerName: '', ownerEmail: '' }
  });

  const {
    register: registerJoin,
    handleSubmit: handleJoinSubmit,
    formState: { errors: joinErrors },
    reset: resetJoin
  } = useForm({
    defaultValues: { joinCode: '', name: '', email: '' }
  });

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const onCreate = handleCreateSubmit(async (values) => {
    setCreateFeedback(null);
    setIsCreating(true);
    try {
      const payload = {
        name: values.name.trim(),
        ownerName: values.ownerName.trim(),
        ownerEmail: values.ownerEmail.trim()
      };

      const data = await createGroup(payload);

      rememberAdminCode(data.joinCode, data.adminCode, { name: data.name || payload.name });
      rememberParticipantAccess(data.hostParticipant.id, data.hostParticipant.accessCode);
      rememberParticipantForGroup(data.joinCode, {
        id: data.hostParticipant.id,
        name: data.hostParticipant.name || payload.ownerName,
        isOwner: true
      });
      refreshStoredGroups();

      setCreateFeedback(`Grupo creado. Tu código es ${data.joinCode}.`);
      resetCreate();

      navigate(`/grupos/${data.joinCode}`, {
        state: { adminCode: data.adminCode }
      });
    } catch (error) {
      setCreateFeedback(error.message || 'No pudimos crear el grupo. Inténtalo de nuevo.');
    } finally {
      setIsCreating(false);
    }
  });

  const onJoin = handleJoinSubmit(async (values) => {
    setJoinFeedback(null);
    setIsJoining(true);
    try {
      const joinCode = values.joinCode.trim().toUpperCase();
      const payload = { name: values.name.trim(), email: values.email.trim() };
      const data = await addParticipant(joinCode, payload);

      rememberParticipantAccess(data.participant.id, data.accessCode);
      rememberParticipantForGroup(joinCode, data.participant);
      refreshStoredGroups();

      resetJoin();

      navigate(`/grupos/${joinCode}/participantes/${data.participant.id}`, {
        state: { accessCode: data.accessCode }
      });
    } catch (error) {
      setJoinFeedback(error.message || 'No pudimos unirte al grupo. Revisa el código e inténtalo de nuevo.');
    } finally {
      setIsJoining(false);
    }
  });

  const hasSavedRooms = savedHosts.length > 0 || savedParticipantLinks.length > 0;

  const steps = [
    {
      title: 'Crea o únete',
      description: 'Cada invitado recibe un código único y seguro para administrar su lista desde el celular.',
      icon: '🧑‍🎄'
    },
    {
      title: 'Comparte deseos',
      description: 'Las listas son privadas: solo tú las editas y tus amigos solo las leen para inspirarse.',
      icon: '🎁'
    },
    {
      title: 'Magia al revelar',
      description: 'El anfitrión decide cuándo aparece cada amigo secreto y puede cerrar la sala en un clic.',
      icon: '✨'
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      {infoMessage ? (
        <div className="rounded-3xl border border-holly-200/60 bg-white/80 px-4 py-3 text-center text-sm text-moss-700 shadow-sm">
          {infoMessage}
        </div>
      ) : null}

      <Card title="Comencemos" description="Un espacio pensado para familias y amigos, con un toque navideño en cada paso.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className="flex flex-col items-center gap-2 rounded-2xl border border-snow-200 bg-white/90 p-4 text-center"
            >
              <span className="text-3xl" aria-hidden>
                {step.icon}
              </span>
              <h3 className="text-base font-semibold text-moss-900">{step.title}</h3>
              <p className="text-sm text-moss-600">{step.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="Tu sala navideña"
        description="Alterna entre crear una sala o unirte a una existente. Cada vista está optimizada para móviles."
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-snow-50/70 p-2">
            <Button
              variant={activePanel === 'create' ? 'secondary' : 'subtle'}
              className="text-sm"
              onClick={() => setActivePanel('create')}
            >
              🏠 Crear sala
            </Button>
            <Button
              variant={activePanel === 'join' ? 'secondary' : 'subtle'}
              className="text-sm"
              onClick={() => setActivePanel('join')}
            >
              📩 Unirme
            </Button>
          </div>

          {activePanel === 'create' ? (
            <form className="flex flex-col gap-3" onSubmit={onCreate}>
              <TextField
                label="Nombre de la sala"
                placeholder="Navidad en familia"
                {...registerCreate('name', { required: 'Ponle nombre a tu grupo' })}
                error={createErrors.name?.message}
              />
              <TextField
                label="Tu nombre"
                placeholder="Florencia"
                {...registerCreate('ownerName', { required: 'Cuéntanos quién organiza' })}
                error={createErrors.ownerName?.message}
              />
              <TextField
                label="Correo de contacto"
                type="email"
                placeholder="florencia@email.com"
                helperText="Así podrás recibir recordatorios si decides activarlos."
                {...registerCreate('ownerEmail')}
                error={createErrors.ownerEmail?.message}
              />
              <Button type="submit" disabled={isCreating}>
                {isCreating ? <Loader label="Creando tu sala…" /> : 'Crear sala navideña'}
              </Button>
              {createFeedback ? <p className="text-xs text-holly-700">{createFeedback}</p> : null}
            </form>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={onJoin}>
              <TextField
                label="Código del grupo"
                placeholder="ABC123XY"
                {...registerJoin('joinCode', { required: 'Escribe el código recibido' })}
                error={joinErrors.joinCode?.message}
              />
              <TextField
                label="Tu nombre"
                placeholder="Mateo"
                {...registerJoin('name', { required: 'Tu nombre es necesario' })}
                error={joinErrors.name?.message}
              />
              <TextField
                label="Correo (opcional)"
                type="email"
                placeholder="mateo@email.com"
                {...registerJoin('email')}
                error={joinErrors.email?.message}
              />
              <Button type="submit" disabled={isJoining}>
                {isJoining ? <Loader label="Uniéndote…" /> : 'Unirme a la sala'}
              </Button>
              {joinFeedback ? <p className="text-xs text-holly-700">{joinFeedback}</p> : null}
            </form>
          )}
        </div>
      </Card>

      {hasSavedRooms ? (
        <Card
          title="Salas guardadas"
          description="Recupera tus espacios favoritos de anfitrión o participante en segundos."
        >
          <div className="flex flex-col gap-4 text-sm text-moss-700">
            {savedHosts.length ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-holly-100 bg-holly-50/70 p-4">
                <h3 className="text-base font-semibold text-moss-900">Como anfitrión</h3>
                <ul className="flex flex-col gap-3">
                  {savedHosts.map((group) => (
                    <li
                      key={`${group.joinCode}-admin`}
                      className="flex flex-col gap-2 rounded-2xl border border-white/70 bg-white p-3 shadow-sm"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wide text-moss-500">{group.joinCode}</span>
                        <strong className="text-lg text-moss-900">{group.name}</strong>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          className="flex-1"
                          variant="secondary"
                          onClick={() =>
                            navigate(`/grupos/${group.joinCode}`, { state: { adminCode: group.adminCode } })
                          }
                        >
                          Panel de anfitrión
                        </Button>
                        {group.ownerParticipantId && group.ownerAccessCode ? (
                          <Button
                            className="flex-1"
                            variant="subtle"
                            onClick={() =>
                              navigate(`/grupos/${group.joinCode}/participantes/${group.ownerParticipantId}`, {
                                state: { accessCode: group.ownerAccessCode }
                              })
                            }
                          >
                            Ver mi lista personal
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {savedParticipantLinks.length ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-berry-100 bg-berry-50/70 p-4">
                <h3 className="text-base font-semibold text-moss-900">Como participante</h3>
                <ul className="flex flex-col gap-3">
                  {savedParticipantLinks.map((entry) => (
                    <li
                      key={`${entry.joinCode}-${entry.participantId}`}
                      className="flex flex-col gap-2 rounded-2xl border border-white/70 bg-white p-3 shadow-sm"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wide text-moss-500">{entry.joinCode}</span>
                        <strong className="text-lg text-moss-900">{entry.groupName}</strong>
                        <span className="text-xs text-moss-500">Ingresar como {entry.participantName}</span>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          navigate(`/grupos/${entry.joinCode}/participantes/${entry.participantId}`, {
                            state: { accessCode: entry.accessCode }
                          })
                        }
                      >
                        Ir a mi intercambio
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
};