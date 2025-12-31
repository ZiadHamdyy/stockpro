import { apiSlice } from "../../ApiSlice";

export interface CreateSupportTicketRequest {
  name: string;
  phone: string;
  problemType: string;
  title: string;
  details: string;
}

export interface CreateSupportTicketResponse {
  message: string;
}

export const supportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createSupportTicket: builder.mutation<CreateSupportTicketResponse, CreateSupportTicketRequest>({
      query: (data) => ({
        url: '/support/ticket',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { data: CreateSupportTicketResponse }): CreateSupportTicketResponse => {
        return response.data;
      },
    }),
  }),
});

export const { useCreateSupportTicketMutation } = supportApi;

