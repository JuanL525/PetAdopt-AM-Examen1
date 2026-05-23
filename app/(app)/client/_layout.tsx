import { Slot } from 'expo-router';
import { RoleGuard } from '../../../components/RoleGuard';

export default function ClientLayout() {
  return (
    <RoleGuard allowedRole="client">
      <Slot />
    </RoleGuard>
  );
}
