import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { TextField } from '../components/TextField.jsx';
import { useGroupsApi } from '../services/groups.js';
import { Loader } from '../components/Loader.jsx';

export const LandingPage = () => {
  const navigate = useNavigate();
  const groupsApi = useGroupsApi();
  const [createError, setCreateError] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [createdGroup, setCreatedGroup] = useState(null);
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors, isSubmitting: isCreating }
  } = useForm({ defaultValues: { name: '', ownerName: '', ownerEmail: '' } });
  const {
    register: registerJoin,
    handleSubmit: handleSubmitJoin,
    formState: { errors: joinErrors, isSubmitting: isJoining }
  } = useForm({ defaultValues: { joinCode: '', name: '', email: '' } });

  const onCreateGroup = async (values) => {
    setCreateError(null);
    try {
      const group = await groupsApi.createGroup(values);
      setCreatedGroup(group);
    } catch (error) {
      setCreateError(error.message ?? 'No se pudo crear el grupo');
    }
  };

  const onJoinGroup = async ({ joinCode, ...participant }) => {
    setJoinError(null);
    try {
      const participantCreated = await groupsApi.addParticipant(joinCode.toUpperCase(), participant);
      navigate(`/grupos/${joinCode.toUpperCase()}/participantes/${participantCreated._id}`, {
        state: { participant: participantCreated }
      });
    } catch (error) {
      setJoinError(error.message ?? 'No se pudo unir al grupo');
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/40 via-brand-500/20 to-slate-900 p-8 shadow-2xl shadow-brand-900/40">
          <p className="text-sm uppercase tracking-[0.4em] text-brand-200">Secret Santa</p>
          <h2 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">
            Organiza intercambios navideños en minutos
          </h2>
          <p className="mt-4 max-w-xl text-lg text-slate-200">
            Crea grupos privados, invita a tus amigos y deja que el algoritmo asigne a cada quien su amigo secreto sin repetir y sin revelar nada hasta que llegue el momento perfecto.
          </p>
          <ul className="mt-6 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
            <li className="flex items-start gap-3">
              <span className="mt-1 text-brand-200">🎄</span>
              <span>Generación automática de emparejamientos sin repeticiones.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 text-brand-200">🎁</span>
              <span>Lista de deseos conectada con tus productos favoritos de Amazon.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 text-brand-200">🔐</span>
              <span>Controla cuándo revelar el amigo secreto con un solo click.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 text-brand-200">💌</span>
              <span>Comparte el enlace de tu grupo y deja que todos se inscriban.</span>
            </li>
          </ul>
        </div>
        {createdGroup ? (
          <Card
            title="¡Grupo listo!"
            description="Comparte el código y guarda este panel para administrar el intercambio."
            actions={
              <Button onClick={() => navigate(`/grupos/${createdGroup.joinCode}`)} className="w-full sm:w-auto">
                Ir al panel del grupo
              </Button>
            }
          >
            <div className="grid gap-2">
              <span className="text-sm text-slate-300">Código de invitación</span>
              <div className="flex items-center justify-between rounded-xl border border-brand-300/40 bg-white/10 p-4 text-2xl font-bold tracking-[0.35em] text-brand-100">
                {createdGroup.joinCode}
              </div>
              <p className="text-sm text-slate-400">
                Comparte este código con las personas que participarán para que se unan y creen su lista de deseos.
              </p>
            </div>
          </Card>
        ) : null}
      </div>
      <div className="flex flex-col gap-6">
        <Card title="Crear un nuevo grupo" description="Configura el intercambio y obtén un código único para invitar.">
          <form className="flex flex-col gap-4" onSubmit={handleSubmitCreate(onCreateGroup)}>
            <TextField
              label="Nombre del grupo"
              placeholder="Navidad con la familia"
              error={createErrors.name?.message}
              {...registerCreate('name', { required: 'Este campo es obligatorio', minLength: { value: 3, message: 'Debe tener al menos 3 caracteres' } })}
            />
            <TextField
              label="Tu nombre"
              placeholder="Mariana"
              error={createErrors.ownerName?.message}
              {...registerCreate('ownerName', {
                required: 'Este campo es obligatorio',
                minLength: { value: 2, message: 'Debe tener al menos 2 caracteres' }
              })}
            />
            <TextField
              label="Correo electrónico (opcional)"
              placeholder="tu@email.com"
              type="email"
              error={createErrors.ownerEmail?.message}
              {...registerCreate('ownerEmail', {
                pattern: { value: /\S+@\S+\.\S+/, message: 'Ingresa un correo válido' }
              })}
            />
            {createError ? <p className="text-sm text-red-300">{createError}</p> : null}
            <Button type="submit" disabled={isCreating}>
              {isCreating ? <Loader label="Creando…" /> : 'Crear grupo'}
            </Button>
          </form>
        </Card>
        <Card title="Unirme a un grupo" description="Registra tus datos y tu lista de deseos para participar.">
          <form className="flex flex-col gap-4" onSubmit={handleSubmitJoin(onJoinGroup)}>
            <TextField
              label="Código del grupo"
              placeholder="ABC12345"
              className="uppercase"
              error={joinErrors.joinCode?.message}
              {...registerJoin('joinCode', {
                required: 'Ingresa el código que te compartieron',
                minLength: { value: 6, message: 'El código es muy corto' }
              })}
            />
            <TextField
              label="Tu nombre"
              placeholder="Carla"
              error={joinErrors.name?.message}
              {...registerJoin('name', {
                required: 'Ingresa tu nombre',
                minLength: { value: 2, message: 'Debe tener al menos 2 caracteres' }
              })}
            />
            <TextField
              label="Correo electrónico (opcional)"
              placeholder="tucorreo@email.com"
              type="email"
              error={joinErrors.email?.message}
              {...registerJoin('email', {
                pattern: { value: /\S+@\S+\.\S+/, message: 'Ingresa un correo válido' }
              })}
            />
            {joinError ? <p className="text-sm text-red-300">{joinError}</p> : null}
            <Button type="submit" disabled={isJoining}>
              {isJoining ? <Loader label="Uniéndote…" /> : 'Quiero participar'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
