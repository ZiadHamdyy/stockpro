import { apiSlice } from "../../ApiSlice";
import { getUserById } from "./user";

interface UserState {
  id: string | null,
  name: string | null,
  email: string | null,
  password: string | null,
  photo: string | null;
  dayOfBirth: number | null;
}


export const userSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getUserById: builder.query<UserState, string>({
      query: () => `user/`,
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(getUserById(data));
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      },
    }),
  })
})
export const { useGetUserByIdQuery } = userSlice

export default userSlice.reducer;