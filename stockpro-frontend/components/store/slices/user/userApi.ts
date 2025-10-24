import { apiSlice } from "../../ApiSlice";
import { getUserById } from "./user";

interface UserState {
  id: string | null;
  name: string | null;
  email: string | null;
  password: string | null;
  photo: string | null;
  dayOfBirth: number | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  active: boolean;
  emailVerified: boolean;
  role?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  image?: string;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {}

export const userSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserById: builder.query<UserState, string>({
      query: () => `user/`,
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(getUserById(data));
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      },
    }),
    getUsers: builder.query<User[], void>({
      query: () => "users",
      transformResponse: (response: any) => {
        console.log('getUsers API response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', Object.keys(response || {}));
        
        // Handle the response format: { data: { data: User[], meta: {...} } }
        if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
          console.log('Returning response.data.data:', response.data.data);
          console.log('Response.data.data length:', response.data.data.length);
          return response.data.data;
        }
        // Fallback for direct data array
        if (response && response.data && Array.isArray(response.data)) {
          console.log('Returning response.data:', response.data);
          return response.data;
        }
        // Fallback if response is already an array
        if (Array.isArray(response)) {
          console.log('Returning response as array:', response);
          return response;
        }
        // Return empty array if no valid data
        console.log('Returning empty array - no valid data found');
        return [];
      },
      providesTags: ["User"],
    }),
    getUser: builder.query<User, string>({
      query: (id) => `users/${id}`,
      transformResponse: (response: { data: User }) => response.data,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),
    createUser: builder.mutation<User, CreateUserRequest>({
      query: (data) => ({
        url: "users",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: { data: User }) => response.data,
      invalidatesTags: ["User"],
    }),
    updateUser: builder.mutation<User, { id: string; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({
        url: `users/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: { data: User }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "User", id },
        "User",
      ],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "User", id },
        "User",
      ],
    }),
  }),
});
export const { 
  useGetUserByIdQuery, 
  useGetUsersQuery, 
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation
} = userSlice;

export default userSlice.reducer;
