import { Slot } from 'expo-router';
import { RoleGuard } from '../../../components/RoleGuard';

export default function SellerLayout() {
  return (
    <RoleGuard allowedRole="seller">
      <Slot />
    </RoleGuard>
  );
}
