import { logOut, setCredentials } from './auth';
import { apiSlice } from '../../ApiSlice';

interface RegisterUser {
  name: string;
  email: string;
  password: string;
}
interface LoginUser {
  email: string;
  password: string;
}
interface ForgotPasswordUser {
  email: string;
}
interface ResetPasswordUser {
  email: string;
  newPassword: string;
}
/* interface User {
  id: string | null,
  name: string | null,
  email: string | null,
  password: string | null,
  refreshToken: string | null,
  provider: string | null,
  providerId: string | null,
  verified: boolean | null,
  photo: string | null;
} */

interface RefreshResponse {
  accessToken: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder: any) => ({

    registerUser: builder.mutation({
      query: (credentials: RegisterUser) => ({
        url: 'auth/signup',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_arg: any, { dispatch, queryFulfilled }: any) {
        try {
          const { data } = await queryFulfilled;
          if (data && data.data && data.data.accessToken) {
            return data;
          }
        } catch (error) {
          console.error('Register failed:', error);
          throw error;
        }
      },
    }),
    verifyEmailOtp: builder.mutation({
      query: (EmailAndCode: any) => ({
        url: 'auth/verify-email',
        method: 'POST',
        body: EmailAndCode,
      }),
      async onQueryStarted(_arg: any, { dispatch, queryFulfilled }: any) {
        try {
          const { data } = await queryFulfilled;
            if (data && data.data && data.data.accessToken) {
              dispatch(setCredentials({ accessToken: data.data.accessToken, user: data.data.user }));
            }
        } catch (error) {
          console.error('Couldnt Verify Your Email:', error);
        }
      },
    }),
    resendEmailOtp: builder.mutation({
      query: (EmailAndCode: any) => ({
        url: 'auth/resend-verification',
        method: 'POST',
        body: EmailAndCode,
      }),
      async onQueryStarted(_arg: any, { dispatch, queryFulfilled }: any) {
        try {
          const { data } = await queryFulfilled;
          if (data && data.data && data.data.accessToken) {
            dispatch(setCredentials({ accessToken: data.data.accessToken, user: data.data.user }));
          }

        } catch (error) {
          console.error('Couldnt Verify Your Email:', error);
        }
      },
    }),
    loginUser: builder.mutation({
      query: (credentials: LoginUser) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
        async onQueryStarted(_arg: any, { dispatch, queryFulfilled }: any) {
          try {
            const { data } = await queryFulfilled;
            if (data && data.data && data.data.accessToken) {
              dispatch(setCredentials({ accessToken: data.data.accessToken, user: data.data.user }));
            }
          } catch (error) {
            console.error('Login failed:', error);
          }
        },
    }),
    googleAuth: builder.mutation({
      query: () => ({
        url: 'social/google',
        method: 'GET',
      }),
      async onQueryStarted(_arg: any, { dispatch, queryFulfilled }: any) {
        try {
          const { data } = await queryFulfilled;
          if (data && data.data && data.data.accessToken) {
            dispatch(setCredentials({ accessToken: data.data.accessToken, user: data.data.user }));
          } else {
            console.error('Google login failed: No access token found');
          }
        } catch (error) {
          console.error('Login With Google failed:', error);
        }
      },
    }),
    sendLogOut: builder.mutation({
      query: () => ({
        url: 'auth/logout',
        method: 'DELETE',
      }),
      async onQueryStarted(_arg: any, { dispatch, queryFulfilled }: any) {
        try {
          await queryFulfilled;
          dispatch(logOut());
          dispatch(authApi.util.resetApiState());
        } catch (err) {
          console.error('Logout failed:', err);
        }
      },
    }),
    refresh: builder.mutation({
      query: () => ({
        url: 'auth/refresh',
        method: 'POST',
      }),
    }),
    forgotPassword: builder.mutation({
      query: (credentials: ForgotPasswordUser) => ({
        url: 'auth/forgot-password',
        method: 'PATCH',
        body: credentials,
      }),
      async onQueryStarted(_arg: any, { queryFulfilled }: any) {
        try {
        await queryFulfilled;
        } catch (error) {
          console.error('Forgot password failed:', error);
        }
      },
    }),
    verifyForgotPasswordOtp: builder.mutation({
      query: (EmailAndCode: any) => ({
        url: 'auth/verify-forgot-password',
        method: 'PATCH',
        body: EmailAndCode,
      }),
      async onQueryStarted(_arg, {queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error('Couldnt Verify Forgot Password OTP:', error);
        }
      },
    }),
    resendForgotPasswordOtp: builder.mutation({
      query: (EmailAndCode: any) => ({
        url: 'auth/resend-forgot-password',
        method: 'POST',
        body: EmailAndCode,
      }),
      async onQueryStarted(_arg: any, { dispatch, queryFulfilled }: any) {
        try {
          const { data } = await queryFulfilled;
          if (data && data.data && data.data.accessToken) {
            dispatch(setCredentials({ accessToken: data.data.accessToken, user: data.data.user }));
          }
        } catch (error) {
          console.error('Couldnt Resend Forgot Password OTP:', error);
        }
      },
    }),
    resetPassword: builder.mutation({
      query: (credentials: ResetPasswordUser) => ({
        url: 'auth/reset-password',
        method: 'PATCH',
        body: credentials,
      }),
      async onQueryStarted(_arg: any, { queryFulfilled }: any) {
        try {
          const { data } = await queryFulfilled;
        } catch (error) {
          console.error('Reset password failed:', error);
        }
      },
    }),
  }),
  
  overrideExisting: true,
});

export const { 
  useRegisterUserMutation, 
  useVerifyEmailOtpMutation, 
  useResendEmailOtpMutation, 
  useLoginUserMutation, 
  useSendLogOutMutation, 
  useRefreshMutation, 
  useForgotPasswordMutation,
  useVerifyForgotPasswordOtpMutation,
  useResendForgotPasswordOtpMutation,
  useResetPasswordMutation
} = authApi;
