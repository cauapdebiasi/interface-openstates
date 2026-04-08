import { Card, Image, Text, Group, Badge, Stack, ThemeIcon } from '@mantine/core';
import { IconUser, IconMapPin, IconBuildingMonument } from '@tabler/icons-react';
import type { Politician } from '../services/api';

interface PoliticianCardProps {
  politician: Politician;
}

export function PoliticianCard({ politician }: PoliticianCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" style={{ borderColor: 'black' }} withBorder>
      <Card.Section>
        {politician.image ? (
          <Image
            src={politician.image}
            height={220}
            alt={politician.name}
            fallbackSrc="https://placehold.co/400x220?text=Sem+Foto"
          />
        ) : (
          <Group justify="center" h={220} bg="gray.1">
            <IconUser size={64} color="gray" />
          </Group>
        )}
      </Card.Section>

      <Stack mt="md" gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Text fw={600} size="lg" truncate c="var(--text-h)" style={{ fontFamily: 'var(--heading)' }}>
            {politician.name}
          </Text>
          {politician.party && (
            <Badge bg="var(--accent-bg)" c="var(--accent)" style={{ fontFamily: 'var(--mono)' }}>
              {politician.party}
            </Badge>
          )}
        </Group>

        {politician.role_title && (
          <Group gap="xs" wrap="nowrap" c="var(--text)">
            <ThemeIcon bg="var(--code-bg)" c="var(--text)" size="sm">
              <IconBuildingMonument size={14} />
            </ThemeIcon>
            <Text size="sm" truncate>
              {politician.role_title}
            </Text>
          </Group>
        )}

        {politician.state && (
          <Group gap="xs" wrap="nowrap" c="var(--text)">
            <ThemeIcon bg="var(--social-bg)" c="var(--accent)" size="sm">
              <IconMapPin size={14} />
            </ThemeIcon>
            <Text size="sm">{politician.state}</Text>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
