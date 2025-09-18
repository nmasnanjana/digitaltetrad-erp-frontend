import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4575/api';

export const publicApiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PublicSettings {
  company_name: string;
  company_logo: string;
}

export const getPublicSettings = () =>
  publicApiClient.get<PublicSettings>('/public/settings/public'); 