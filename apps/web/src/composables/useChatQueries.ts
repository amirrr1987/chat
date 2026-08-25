import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { toValue } from 'vue';
import type { ChatDto, MessageDto } from '@arazchat/shared';
import { api } from '@/lib/api';

export function useChatsQuery() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data } = await api.get<ChatDto[]>('/chats');
      return data;
    },
  });
}

export function useMessagesQuery(chatId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      const id = toValue(chatId);
      const { data } = await api.get<MessageDto[]>(`/chats/${id}/messages`);
      return data;
    },
    enabled: () => !!toValue(chatId),
  });
}

export function useCreateDirectChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (participantId: string) => {
      const { data } = await api.post<ChatDto>('/chats/direct', { participantId });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chats'] }),
  });
}

export function useCreateGroupChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; participantIds: string[] }) => {
      const { data } = await api.post<ChatDto>('/chats/group', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chats'] }),
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<{ url: string }>('/upload/image', form);
      return data.url;
    },
  });
}

export function useUpdateChatPrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      chatId: string;
      allowForward?: boolean;
      allowScreenshot?: boolean;
    }) => {
      const { chatId, ...body } = payload;
      const { data } = await api.patch<ChatDto>(`/chats/${chatId}/privacy`, body);
      return data;
    },
    onSuccess: (updated) => {
      qc.setQueryData<ChatDto[]>(['chats'], (old) =>
        (old ?? []).map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
      );
    },
  });
}
