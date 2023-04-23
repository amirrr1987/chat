import { defineStore } from 'pinia';
import { assign, without } from 'lodash-es';
import { api } from 'src/boot/axios';
import { reactive } from 'vue';

interface Chat {
  _id: string;
  friendId: string;
  chatId: string;
}
interface User {
  _id: string;
  username: string;
  avatar: string;
  chats: Chat[];
}
interface State {
  drawerVisibility: boolean;
  users: User[];
  user: User;
}

export const useAppConfigStore = defineStore('appConfig', () => {
  const state = reactive<State>({
    drawerVisibility: false,
    users: [],
    user: {
      _id: '',
      username: '',
      avatar: '',
      chats: [],
    },
  });

  const toggleDrawer = () => {
    state.drawerVisibility != state.drawerVisibility;
  };
  const getUsersWithoutMe = async ({ senderId }) => {
    const { data } = await api.get('/users');
    const x = without(data.data, senderId);
    console.log('x', x);

    // assign(state.users, data.data);
  };

  // const getMessages = async ({
  //   getterId,
  //   senderId,
  //   message,
  // }: {
  //   message: string;
  //   senderId: string;
  //   getterId: string;
  // }) => {
  //   const { data } = await api.post('/chats', {
  //     message: message,
  //     senderId: senderId,
  //     getterId: getterId,
  //   });
  //   console.log(data);
  // };

  // const getChats = async ({ getterId }: { getterId: string }) => {
  //   const userIndex = state.users.findIndex((item) => {
  //     return item.chats.findIndex((single) => {
  //       console.log(single);
  //       return single.friendId == getterId;
  //     });
  //   });
  //   console.log(state.users[userIndex].chats);
  // };

  // const setSender = ({ senderId }: { senderId: string }) => {
  //   const index = findIndex(state.users, (item) => item._id == senderId);
  //   console.log(index);
  //   assign(state.user, state.users[index]);
  // };

  // const login = () => {
  //   return true;
  // };
  return {
    state,
    toggleDrawer,
    getUsersWithoutMe,
    // getMessages,
    // login,
    // setSender,
    // getChats,
  };
});
