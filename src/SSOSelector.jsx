import React from "react";
import { SSO_PROVIDERS, TEAMS_SSO_PROVIDER } from "./authConfig";
import { Persona, PersonaSize, Stack, Text, Image, ImageFit } from "@fluentui/react";

/**
 * SSOSelector component
 * Renders SSO options based on environment (browser or Teams).
 * @param {Object} props
 * @param {boolean} props.isInTeams - True if running inside Microsoft Teams
 * @param {function} props.onSelect - Callback when an SSO provider is selected
 */
export default function SSOSelector({ isInTeams, onSelect }) {
  const providers = isInTeams ? [TEAMS_SSO_PROVIDER] : SSO_PROVIDERS;

  return (
    <Stack tokens={{ childrenGap: 32 }} horizontalAlign="center" style={{ marginTop: 32 }}>
      <Text variant="xLarge">Sign in with:</Text>
      <Stack horizontal tokens={{ childrenGap: 35 }}>
        {providers.map((provider) => (
          <div
            key={provider.id}
            onClick={() => onSelect(provider)}
            style={{
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transition: "transform 0.12s, box-shadow 0.12s",
              borderRadius: 12,
              padding: 8,
              minWidth: 100,
              boxShadow: "0 1px 6px #0001",
              background: "#fafbfc",
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = "translateY(-4px) scale(1.06)";
              e.currentTarget.style.boxShadow = "0 4px 16px #0078d422";
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 1px 6px #0001";
            }}
          >
            <Image
              src={provider.logo}
              alt={provider.name}
              width={56}
              height={56}
              imageFit={ImageFit.contain}
              style={{ borderRadius: 8, marginBottom: 8, background: '#fff' }}
            />
            <Text style={{ textAlign: "center", fontWeight: 500, fontSize: 16, marginTop: 2 }}>{provider.name}</Text>
          </div>
        ))}
      </Stack>
    </Stack>
  );
}
