import type { AddressInfo } from 'node:net';
import { app } from './app.ts';

const server = app.listen(3000, () => {
  const { address, port } = server.address() as AddressInfo;
  const host = address === '::' || address === '0.0.0.0' ? 'localhost' : address;
  console.log(`Server listening at http://${host}:${port}`);
});
