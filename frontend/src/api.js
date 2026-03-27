import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:4000/api' });

export const loadEntry = async (account, marketplace, date) => {
  const res = await API.get('/entries', { params: { account, marketplace, date } });
  return res.data;
};

export const saveEntry = async (payload) => {
  const res = await API.post('/entries', payload);
  return res.data;
};

export const fetchAggregate = async () => {
  const res = await API.get('/entries/aggregate');
  return res.data;
};

export const fetchAggregateWithParams = async (params) => {
  const res = await API.get('/entries/aggregate', { params });
  return res.data;
};

export const fetchDates = async (account, marketplace) => {
  const res = await API.get('/entries/dates', { params: { account, marketplace } });
  return res.data;
};

export const fetchAccounts = async (marketplace) => {
  const res = await API.get('/accounts', { params: { marketplace } });
  return res.data;
};

export const createAccount = async (name, marketplace) => {
  const res = await API.post('/accounts', { name, marketplace });
  return res.data;
};

export const fetchMarketplaces = async () => {
  const res = await API.get('/accounts/marketplaces/list');
  return res.data;
};

export const fetchCategories = async () => {
  const res = await API.get('/categories');
  return res.data;
};

export const createCategory = async (name) => {
  const res = await API.post('/categories', { name });
  return res.data;
};

export default API;
