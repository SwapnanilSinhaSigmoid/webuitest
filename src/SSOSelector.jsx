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

  // Responsive icon size based on viewport width
  const [windowSize, setWindowSize] = React.useState({ width: window.innerWidth, height: window.innerHeight });
  React.useEffect(() => {
    const onResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const iconSize = Math.max(40, Math.min(80, Math.floor(windowSize.width / (isInTeams ? 3 : 6))));
  const isMobile = windowSize.width < 600;
  const isPortrait = windowSize.height > windowSize.width;

  // Portrait: vertical grid, else horizontal/grid
  const gridStyle = isPortrait
    ? {
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 14 : 24,
        marginTop: isMobile ? 18 : 32,
        width: isMobile ? '100%' : 'auto',
        alignItems: 'center',
      }
    : {
        display: 'grid',
        gridTemplateColumns: `repeat(${providers.length}, minmax(90px, 1fr))`,
        gap: isMobile ? 18 : 35,
        marginTop: isMobile ? 18 : 32,
        width: isMobile ? '100%' : 'auto',
        justifyContent: 'center',
      };

  return (
    <div
      style={{
        marginTop: isMobile ? 16 : 32,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Text variant={isMobile ? "large" : "xLarge"}>Sign in with:</Text>
      <div style={gridStyle}>
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
              padding: isMobile ? 6 : 12,
              minWidth: 80,
              boxShadow: "0 1px 6px #0001",
              background: "#fafbfc",
              width: '100%',
              maxWidth: 140,
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
              width={iconSize}
              height={iconSize}
              imageFit={ImageFit.contain}
              style={{ borderRadius: 8, marginBottom: 8, background: '#fff', width: iconSize, height: iconSize }}
            />
            <Text style={{ textAlign: "center", fontWeight: 500, fontSize: isMobile ? 14 : 16, marginTop: 2 }}>{provider.name}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}
