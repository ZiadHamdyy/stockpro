import { apiSlice } from "../../ApiSlice";
import { PrintSettings } from "../../../../types";

export const printSettingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPrintSettings: builder.query<PrintSettings | null, void>({
      query: () => "/company/print-settings",
      providesTags: ["Company", "PrintSettings"],
      transformResponse: (response: { data: PrintSettings | null }): PrintSettings | null => {
        return response.data;
      },
    }),
    updatePrintSettings: builder.mutation<PrintSettings, PrintSettings>({
      query: (data) => ({
        url: "/company/print-settings",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Company", "PrintSettings"],
      transformResponse: (response: { data: PrintSettings }): PrintSettings => {
        return response.data;
      },
    }),
  }),
});

export const {
  useGetPrintSettingsQuery,
  useUpdatePrintSettingsMutation,
} = printSettingsApi;

