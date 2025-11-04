import { useApi } from './api-context.jsx';
import { useCallback } from 'react';

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
    async (code) => {
      const { data } = await api.get(`/groups/${code}`);
      return data;
    },
    [api]
  );

  const addParticipant = useCallback(
    async (code, payload) => {
      const { data } = await api.post(`/groups/${code}/participants`, payload);
      return data.participant;
    },
    [api]
  );

  const generateAssignments = useCallback(
    async (code) => {
      const { data } = await api.post(`/groups/${code}/assignments`);
      return data;
    },
    [api]
  );

  const updateSettings = useCallback(
    async (code, payload) => {
      const { data } = await api.patch(`/groups/${code}/settings`, payload);
      return data;
    },
    [api]
  );

  const getParticipant = useCallback(
    async (code, participantId) => {
      const { data } = await api.get(`/groups/${code}/participants/${participantId}`);
      return data.participant;
    },
    [api]
  );

  const getAssignment = useCallback(
    async (code, participantId) => {
      const { data } = await api.get(`/groups/${code}/participants/${participantId}/assignment`);
      return data.participant;
    },
    [api]
  );

  const addWishlistItem = useCallback(
    async (code, participantId, payload) => {
      const { data } = await api.post(`/groups/${code}/participants/${participantId}/wishlist`, payload);
      return data.wishlist;
    },
    [api]
  );

  const removeWishlistItem = useCallback(
    async (code, participantId, itemId) => {
      const { data } = await api.delete(`/groups/${code}/participants/${participantId}/wishlist/${itemId}`);
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
    getParticipant,
    getAssignment,
    addWishlistItem,
    removeWishlistItem
  };
};
