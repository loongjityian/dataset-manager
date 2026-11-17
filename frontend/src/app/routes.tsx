import { Navigate, type RouteObject } from 'react-router'
import { DatasetPage } from '../features/datasets/DatasetPage'
import { HomePage } from '../features/datasets/HomePage'
import { AppLayout } from './AppLayout'
import { RouteError } from './RouteError'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'datasets/:datasetId', element: <DatasetPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]
