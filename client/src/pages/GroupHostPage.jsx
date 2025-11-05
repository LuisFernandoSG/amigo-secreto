import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/Card.jsx";
import { TextField } from "../components/TextField.jsx";
import { Button } from "../components/Button.jsx";
import { Loader } from "../components/Loader.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { useGroupsApi } from "../services/groups.js";
import { useRealtimeGroup } from "../hooks/useRealtimeGroup.js";
import {
  forgetGroup,
  getAdminCode,
  getParticipantAccess,
  rememberAdminCode,
  rememberParticipantForGroup,
} from "../utils/storage.js";

const formatDateDisplay = (value) => {
  if (!value) return "Por definir";
  try {
    return new Intl.DateTimeFormat("es-CR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value));
  } catch (error) {
    return "Por definir";
  }
};

const formatCurrencyDisplay = (value) => {
  if (value === null || value === undefined) return "Libre";
  try {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      maximumFractionDigits: 0,
    }).format(value);
  } catch (error) {
    return `₡${value}`;
  }
};

export const GroupHostPage = () => {
  const { code = "" } = useParams();
  const joinCode = code.toUpperCase();
  const location = useLocation();
  const navigate = useNavigate();

  const locationAdminCode = location.state?.adminCode;
  const storedAdminCode = useMemo(() => getAdminCode(joinCode), [joinCode]);
  const initialAdminCode = locationAdminCode || storedAdminCode || "";

  const { getGroup, generateAssignments, updateSettings, deleteGroup } =
    useGroupsApi();

  const [adminCode, setAdminCode] = useState(initialAdminCode);
  const [adminCodeInput, setAdminCodeInput] = useState(initialAdminCode);
  const [needsAdminCode, setNeedsAdminCode] = useState(!initialAdminCode);
  const [adminFeedback, setAdminFeedback] = useState(null);

  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const [eventDateInput, setEventDateInput] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsMessage, setDetailsMessage] = useState(null);

  const [activeSection, setActiveSection] = useState("overview");

  const loadGroup = useCallback(
    async (codeToUse) => {
      const adminToUse = (codeToUse || adminCode || "").toUpperCase();
      if (!adminToUse) return;
      setIsLoading(true);
      setAdminFeedback(null);
      try {
        const data = await getGroup(joinCode, adminToUse);
        setGroup(data);
        setEventDateInput(data.eventDate ? data.eventDate.slice(0, 10) : "");
        setBudgetInput(
          data.budgetAmount === null || data.budgetAmount === undefined
            ? ""
            : String(data.budgetAmount)
        );
        rememberAdminCode(joinCode, adminToUse, { name: data.name });
        if (data.ownerParticipantId) {
          const owner = data.participants.find(
            (participant) => participant.id === data.ownerParticipantId
          );
          if (owner) {
            rememberParticipantForGroup(joinCode, { ...owner, isOwner: true });
          }
        }
        setNeedsAdminCode(false);
        setAdminCode(adminToUse);
        setAdminCodeInput(adminToUse);
      } catch (error) {
        if (error.response?.status === 404) {
          navigate("/404", { replace: true });
          return;
        }
        if (error.response?.status === 403) {
          setNeedsAdminCode(true);
          setAdminFeedback(
            "El código de administración no es válido. Intenta nuevamente."
          );
          setAdminCode("");
          setGroup(null);
        } else {
          setAdminFeedback(
            error.message || "No pudimos cargar la información del grupo."
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [adminCode, getGroup, joinCode, navigate]
  );

  useEffect(() => {
    if (initialAdminCode) {
      loadGroup(initialAdminCode);
    } else {
      setNeedsAdminCode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRealtimeEvent = useCallback(
    (message) => {
      if (!message?.event) return;
      if (message.event === "group:deleted") {
        setGroup(null);
        forgetGroup(joinCode);
        navigate("/", {
          replace: true,
          state: {
            message:
              "La sala navideña fue eliminada. ¡Crea una nueva cuando quieras!",
          },
        });
        return;
      }
      if (!needsAdminCode) {
        loadGroup();
      }
    },
    [joinCode, loadGroup, navigate, needsAdminCode]
  );

  useRealtimeGroup(joinCode, handleRealtimeEvent);

  const handleAdminSubmit = (event) => {
    event.preventDefault();
    const normalized = adminCodeInput.trim().toUpperCase();
    if (!normalized) {
      setAdminFeedback("Ingresa el código que recibiste al crear el grupo.");
      return;
    }
    loadGroup(normalized);
  };

  const handleCopyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setActionMessage("Código copiado. ¡Compártelo con tus invitados!");
    } catch (error) {
      setActionMessage(
        "No pudimos copiar el código. Copia manualmente: " + joinCode
      );
    }
  };

  const handleGenerateAssignments = async () => {
    if (!adminCode) return;
    setActionLoading("assignments");
    setActionMessage(null);
    try {
      await generateAssignments(joinCode, adminCode);
      setActionMessage("Asignaciones generadas. Avisa cuando quieras revelar.");
      await loadGroup();
    } catch (error) {
      setActionMessage(error.message || "No pudimos generar las asignaciones.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleReveal = async () => {
    if (!adminCode || !group) return;
    setActionLoading("reveal");
    setActionMessage(null);
    try {
      const next = !group.allowReveal;
      await updateSettings(joinCode, adminCode, { allowReveal: next });
      setActionMessage(
        next
          ? "Revelaciones habilitadas. Todos podrán ver a quién regalan."
          : "Las revelaciones se desactivaron."
      );
      await loadGroup();
    } catch (error) {
      setActionMessage(
        error.message || "No pudimos actualizar las revelaciones."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveDetails = async (event) => {
    event.preventDefault();
    if (!adminCode) return;
    const trimmedBudget = budgetInput.trim();
    const parsedBudget = trimmedBudget ? Number(trimmedBudget) : null;
    if (trimmedBudget && Number.isNaN(parsedBudget)) {
      setDetailsMessage("Ingresa un monto válido en colones.");
      return;
    }
    setDetailsLoading(true);
    setDetailsMessage(null);
    try {
      await updateSettings(joinCode, adminCode, {
        eventDate: eventDateInput ? eventDateInput : null,
        budgetAmount: parsedBudget,
      });
      setDetailsMessage("Guardamos la fecha y el presupuesto.");
      await loadGroup();
    } catch (error) {
      setDetailsMessage(error.message || "No pudimos guardar los detalles.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!adminCode || !group) return;
    const confirmed = window.confirm(
      "Esta acción eliminará la sala y todas las listas. ¿Estás seguro de continuar?"
    );
    if (!confirmed) return;
    setActionLoading("delete");
    setActionMessage(null);
    try {
      await deleteGroup(joinCode, adminCode);
      setGroup(null);
      forgetGroup(joinCode);
      navigate("/", {
        replace: true,
        state: { message: `El grupo ${group.name} se eliminó correctamente.` },
      });
    } catch (error) {
      setActionMessage(error.message || "No pudimos eliminar la sala.");
    } finally {
      setActionLoading(null);
    }
  };

  const hostParticipantLink = useMemo(() => {
    if (!group?.ownerParticipantId) return null;
    const accessCode = getParticipantAccess(group.ownerParticipantId);
    if (!accessCode) return null;
    return {
      url: `/grupos/${joinCode}/participantes/${group.ownerParticipantId}`,
      accessCode,
    };
  }, [group, joinCode]);

  return (
    <div className="flex flex-col gap-8">
      {needsAdminCode ? (
        <Card
          title="Ingresa tu código de administrador"
          description="Este código se generó cuando creaste el grupo. Permite controlar revelaciones y ver el tablero en vivo."
        >
          <form className="flex flex-col gap-3" onSubmit={handleAdminSubmit}>
            <TextField
              label="Código de administrador"
              placeholder="XXXXYYYYZZZZ"
              value={adminCodeInput}
              onChange={(event) =>
                setAdminCodeInput(event.target.value.toUpperCase())
              }
            />
            <Button type="submit" variant="secondary">
              Ver mi grupo
            </Button>
            {adminFeedback ? (
              <p className="text-xs text-berry-600">{adminFeedback}</p>
            ) : null}
          </form>
        </Card>
      ) : null}

      {isLoading ? <Loader label="Actualizando datos del grupo…" /> : null}

      {!isLoading && group ? (
        <>
          <div className="grid grid-cols-1 gap-4 rounded-3xl border border-snow-200 bg-white/80 p-3 sm:grid-cols-3">
            {["overview", "participants", "settings"].map((section) => (
              <Button
                key={section}
                variant={activeSection === section ? "secondary" : "subtle"}
                className="text-sm"
                onClick={() => setActiveSection(section)}
              >
                {section === "overview" && "📋 Resumen"}
                {section === "participants" && "🎁 Participantes"}
                {section === "settings" && "🎄 Detalles navideños"}
              </Button>
            ))}
          </div>

          {activeSection === "overview" ? (
            <>
              <Card
                title={group.name}
                description="Comparte el código con tus amigos y controla todo desde aquí. Las actualizaciones aparecen en tiempo real."
              >
                <div className="flex flex-col gap-4 text-sm text-moss-600">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-holly-100 bg-holly-50/70 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-moss-500">
                          Código del grupo
                        </p>
                        <p className="text-base font-semibold text-moss-900">
                          {group.joinCode}
                        </p>
                      </div>
                      <Button onClick={handleCopyJoinCode} variant="subtle">
                        Copiar
                      </Button>
                    </div>

                    <div className="rounded-2xl border border-snow-200 bg-white p-3">
                      <p className="text-xs uppercase tracking-wide text-moss-500">
                        Participantes
                      </p>
                      <p className="text-base font-semibold text-moss-900">
                        {group.participants.length}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-berry-100 bg-berry-50/70 p-3">
                      <p className="text-xs uppercase tracking-wide text-moss-500">
                        Fecha del intercambio
                      </p>
                      <p className="text-base font-semibold text-moss-900">
                        {formatDateDisplay(group.eventDate)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-holly-100 bg-holly-50/70 p-3">
                      <p className="text-xs uppercase tracking-wide text-moss-500">
                        Presupuesto sugerido
                      </p>
                      <p className="text-base font-semibold text-moss-900">
                        {formatCurrencyDisplay(group.budgetAmount)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-snow-200 bg-white p-3">
                      <p className="text-xs uppercase tracking-wide text-moss-500">
                        Asignaciones listas
                      </p>
                      <p className="text-base font-semibold text-moss-900">
                        {group.assignmentsGenerated ? "Sí" : "No todavía"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-snow-200 bg-white p-3">
                      <p className="text-xs uppercase tracking-wide text-moss-500">
                        Revelaciones activas
                      </p>
                      <p className="text-base font-semibold text-moss-900">
                        {group.allowReveal ? "Sí" : "No todavía"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleGenerateAssignments}
                      disabled={actionLoading === "assignments"}
                    >
                      {actionLoading === "assignments" ? (
                        <Loader label="Mezclando participantes…" />
                      ) : (
                        "Generar emparejamientos"
                      )}
                    </Button>
                    <Button
                      onClick={handleToggleReveal}
                      disabled={
                        !group.assignmentsGenerated ||
                        actionLoading === "reveal"
                      }
                      variant="secondary"
                    >
                      {actionLoading === "reveal" ? (
                        <Loader label="Actualizando revelaciones…" />
                      ) : group.allowReveal ? (
                        "Ocultar revelaciones"
                      ) : (
                        "Permitir revelar amigos secretos"
                      )}
                    </Button>
                    <Button
                      onClick={handleDeleteGroup}
                      disabled={actionLoading === "delete"}
                      variant="danger"
                    >
                      {actionLoading === "delete" ? (
                        <Loader label="Eliminando sala…" />
                      ) : (
                        "Eliminar sala navideña"
                      )}
                    </Button>
                    {actionMessage ? (
                      <p className="text-xs text-holly-700">{actionMessage}</p>
                    ) : null}
                  </div>
                </div>
              </Card>

              {hostParticipantLink ? (
                <Card
                  title="Tu enlace personal"
                  description="Desde aquí gestionas tu lista de deseos como un participante más. Guarda el enlace para regresar."
                >
                  <div className="flex flex-col gap-3 text-sm text-moss-600">
                    <p>
                      Accede a{" "}
                      <span className="font-semibold">tu panel de deseos</span>:
                    </p>
                    <Button
                      as="a"
                      href={`${hostParticipantLink.url}?access=${hostParticipantLink.accessCode}`}
                    >
                      Ir a mi lista
                    </Button>
                    <p className="text-[11px] text-moss-500">
                      El enlace incluye tu código privado de acceso.
                    </p>
                  </div>
                </Card>
              ) : null}
            </>
          ) : null}

          {activeSection === "participants" ? (
            <Card
              title="Participantes"
              description="Visualiza las listas de deseos para ayudar a coordinar los regalos."
            >
              {group.participants.length ? (
                <div className="flex flex-col gap-4">
                  {group.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex flex-col gap-3 rounded-2xl border border-snow-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-base font-semibold text-moss-900">
                            {participant.name}
                            {participant.isOwner ? " · Anfitrión" : ""}
                          </span>
                          {participant.email ? (
                            <span className="text-sm text-moss-500">
                              {participant.email}
                            </span>
                          ) : null}
                        </div>
                        <span className="text-xs uppercase tracking-wide text-holly-600">
                          {participant.wishlistCount} deseos
                        </span>
                      </div>
                      {participant.wishlist.length ? (
                        <ul className="list-disc space-y-2 pl-5 text-sm text-moss-700">
                          {participant.wishlist.map((item) => (
                            <li key={item.id}>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-berry-600 hover:text-berry-700"
                              >
                                {item.title}
                              </a>
                              {item.note ? (
                                <span className="ml-2 text-moss-500">
                                  — {item.note}
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-moss-500">
                          Aún no agrega deseos.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="🎄"
                  title="Sin participantes todavía"
                  message="Comparte el código del grupo para que tus amigos se registren."
                />
              )}
            </Card>
          ) : null}

          {activeSection === "settings" ? (
            <Card
              title="Detalles del intercambio"
              description="Define la fecha del encuentro y el presupuesto sugerido para mantener a todos alineados."
            >
              <form
                className="flex flex-col gap-3"
                onSubmit={handleSaveDetails}
              >
                <TextField
                  label="Fecha del intercambio"
                  type="date"
                  value={eventDateInput}
                  onChange={(event) => setEventDateInput(event.target.value)}
                  helperText="Puedes dejarlo vacío si aún están coordinando."
                />
                <TextField
                  label="Presupuesto en colones"
                  type="number"
                  min="0"
                  value={budgetInput}
                  onChange={(event) => setBudgetInput(event.target.value)}
                  helperText="Comparte un monto sugerido. Déjalo en blanco si no habrá límite."
                />
                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={detailsLoading}>
                    {detailsLoading ? (
                      <Loader label="Guardando…" />
                    ) : (
                      "Guardar detalles navideños"
                    )}
                  </Button>
                  {detailsMessage ? (
                    <p className="text-xs text-holly-700">{detailsMessage}</p>
                  ) : null}
                </div>
              </form>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
