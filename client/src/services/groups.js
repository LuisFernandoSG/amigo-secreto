import { useCallback } from 'react';
import { useApi } from './api-context.jsx';

const adminHeaders = (adminCode) => ({
  headers: {
    'x-admin-code': String(adminCode || '').toUpperCase()
  }
});

const accessHeaders = (accessCode) => ({
  headers: {
    'x-access-code': String(accessCode || '').toUpperCase()
  }
});

export const useGroupsApi = () => {
  const api = useApi();

  const createGroup = useCallback(
    async (payload) => {
      const { data } = await api.post('/groups', payload);
      return data;
    },
    [api]
  );

  const getGroup = useCallback(
    async (code, adminCode) => {
      const { data } = await api.get(`/groups/${code}`, adminHeaders(adminCode));
      return data;
    },
    [api]
  );

  const addParticipant = useCallback(
    async (code, payload) => {
      const { data } = await api.post(`/groups/${code}/participants`, payload);
      return data;
    },
    [api]
  );

  const generateAssignments = useCallback(
    async (code, adminCode) => {
      const { data } = await api.post(`/groups/${code}/assignments`, null, adminHeaders(adminCode));
      return data;
    },
    [api]
  );

  const updateSettings = useCallback(
    async (code, adminCode, payload) => {
      const { data } = await api.patch(`/groups/${code}/settings`, payload, adminHeaders(adminCode));
      return data;
    },
    [api]
  );

  const deleteGroup = useCallback(
    async (code, adminCode) => {
      await api.delete(`/groups/${code}`, adminHeaders(adminCode));
    },
    [api]
  );

  const getParticipant = useCallback(
    async (code, participantId, accessCode) => {
      const { data } = await api.get(
        `/groups/${code}/participants/${participantId}`,
        accessHeaders(accessCode)
      );
      return data;
    },
    [api]
  );

  const getAssignment = useCallback(
    async (code, participantId, accessCode) => {
      const { data } = await api.get(
        `/groups/${code}/participants/${participantId}/assignment`,
        accessHeaders(accessCode)
      );
      return data;
    },
    [api]
  );

  const addWishlistItem = useCallback(
    async (code, participantId, accessCode, payload) => {
      const { data } = await api.post(
        `/groups/${code}/participants/${participantId}/wishlist`,
        payload,
        accessHeaders(accessCode)
      );
      return data.wishlist;
    },
    [api]
  );

  const removeWishlistItem = useCallback(
    async (code, participantId, accessCode, itemId) => {
      const { data } = await api.delete(
        `/groups/${code}/participants/${participantId}/wishlist/${itemId}`,
        accessHeaders(accessCode)
      );
      return data.wishlist;
    },
    [api]
  );

  return {
    createGroup,
    getGroup,
    addParticipant,
    generateAssignments,
    updateSettings,
    deleteGroup,
    getParticipant,
    getAssignment,
    addWishlistItem,
    removeWishlistItem
  };
};