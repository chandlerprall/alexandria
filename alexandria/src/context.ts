import { createContext } from 'react';
import { AlexandriaContextShape } from './types';

export const AlexandriaContext = createContext<AlexandriaContextShape>(null as unknown as AlexandriaContextShape);
