import { ROUTES } from '../../../model/providers';
import {
  Assessment,
  AllInclusive,
  Ballot,
  Build,
  DashboardRounded,
  FormatListBulleted,
  Forum,
  ImportContacts,
  PeopleAlt,
  Settings,
  VerticalSplit,
} from '@material-ui/icons';

export const GROUPS = [
  {
    items: [
      {
        text: 'Dashboard',
        link: ROUTES.DASHBOARD,
        Icon: DashboardRounded,
      },
    ],
  },
  {
    name: 'API Management',
    items: [
      {
        text: 'My APIs',
        link: ROUTES.APIS,
        Icon: FormatListBulleted,
      },
      {
        text: 'My Data Sources',
        link: ROUTES.DATA_SOURCES,
        Icon: VerticalSplit,
      },
      {
        text: 'Metrics & Logs',
        link: ROUTES.METRICS_AND_LOGS,
        Icon: Assessment,
      },
      {
        text: 'APIs Activity',
        link: ROUTES.APIS_ACTIVITY,
        Icon: Assessment,
      },
    ],
  },
  {
    name: 'Settings',
    items: [
      {
        text: 'Users & Permissions',
        link: ROUTES.USERS,
        Icon: PeopleAlt,
      },
      {
        text: 'Global settings',
        link: ROUTES.GLOBAL,
        Icon: Settings,
      },
      {
        text: 'Webhooks',
        link: ROUTES.WEBHOOKS,
        Icon: AllInclusive,
      },
      {
        text: 'Gateway nodes',
        link: ROUTES.NODES,
        Icon: Ballot,
      },
    ],
  },
  {
    name: 'Help',
    items: [
      {
        text: 'Documentation',
        link: ROUTES.DOCUMENTATION,
        Icon: ImportContacts,
      },
      {
        text: 'Support forum',
        link: ROUTES.SUPPORT,
        Icon: Forum,
      },
      {
        text: 'Professional services',
        link: ROUTES.SERVICES,
        Icon: Build,
      },
    ],
  },
];
