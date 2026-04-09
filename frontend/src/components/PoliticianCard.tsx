import { Card, Image, Text, Group, Badge, Stack, ThemeIcon } from '@mantine/core';
import { IconUser, IconMapPin, IconBuildingMonument } from '@tabler/icons-react';
import type { Politician } from '../services/api';

interface PoliticianCardProps {
  politician: Politician;
}

export function PoliticianCard({ politician }: PoliticianCardProps) {
  return (
    <Card className="politician-card" padding="lg">
      <Card.Section>
        {politician.image ? (
          <Image
            src={politician.image}
            height={220}
            alt={politician.name}
            fallbackSrc="https://placehold.co/400x220?text=Sem+Foto"
          />
        ) : (
          <Group className="card-placeholder" justify="center" h={220}>
            <IconUser size={64} />
          </Group>
        )}
      </Card.Section>

      <Stack mt="md" gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Text className="politician-name" fw={600} size="lg" truncate>
            {politician.name}
          </Text>
          {politician.party && (
            <Badge className="party-badge">
              {politician.party}
            </Badge>
          )}
        </Group>

        {politician.role_title && (
          <Group gap="xs" wrap="nowrap">
            <ThemeIcon className="detail-icon" size="sm">
              <IconBuildingMonument size={14} />
            </ThemeIcon>
            <Text className="detail-text" size="sm" truncate>
              {politician.role_title}
            </Text>
          </Group>
        )}

        {politician.state && (
          <Group gap="xs" wrap="nowrap">
            <ThemeIcon className="detail-icon" size="sm">
              <IconMapPin size={14} />
            </ThemeIcon>
            <Text className="detail-text" size="sm">{politician.state}</Text>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
