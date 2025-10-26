import { apiSlice } from "../ApiSlice";

export const backupApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    downloadBackup: builder.query<Blob, void>({
      query: () => ({
        url: "backup/download",
        responseHandler: (response: Response) => response.blob(),
      }),
      // Prevent caching and serialization of Blob
      keepUnusedDataFor: 0,
      transformResponse: (response: Blob) => response,
      serializeQueryArgs: () => "downloadBackup",
    }),
  }),
});

export const { useLazyDownloadBackupQuery } = backupApiSlice;
