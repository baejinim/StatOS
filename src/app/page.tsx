import type { Metadata } from "next";
import Image from "next/image";

// speaking removed
import { ArrowUpRight } from "@/components/icons/ArrowUpRight";
import { GitHubIcon, XIcon, YouTubeIcon } from "@/components/icons/SocialIcons";
import {
  List,
  ListItem,
  ListItemLabel,
  ListItemSubLabel,
  Section,
  SectionHeading,
} from "@/components/shared/ListComponents";
import { createMetadata, createPersonJsonLd } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Brian Lovin",
  description:
    "Brian Lovin is a designer and software engineer living in San Francisco, currently designing AI products at Notion.",
  path: "/",
});

export default function Home() {
  const personJsonLd = createPersonJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="text-primary mx-auto flex max-w-2xl flex-1 flex-col gap-16 py-16 leading-[1.6] sm:py-32">
            <Section>
              <Image
                src="/img/avatar.jpg"
                alt="Jiwon Bae"
                width={60}
                height={60}
                draggable={false}
                className="mb-8 rounded-full select-none"
              />

              <h1 id="home-title" className="text-2xl font-semibold">
                Jiwon Bae
              </h1>

              <p className="text-secondary text-2xl font-semibold text-pretty">
                Student at Konkuk Univ, studying Computer Science & Applied Statistics
              </p>
            </Section>

            <Section className="flex flex-row gap-2">
              <ListItem href="https://x.com" className="group -ml-1 p-2">
                <XIcon size={28} className="text-quaternary group-hover:text-primary select-none" />
              </ListItem>
              <ListItem href="https://www.youtube.com" className="group p-2">
                <YouTubeIcon
                  size={32}
                  className="text-quaternary select-none group-hover:text-[#FF0302]"
                  playIconClassName="fill-[var(--background-color-main)] sm:fill-[var(--background-color-elevated)]  group-hover:fill-white"
                />
              </ListItem>
              <ListItem href="https://github.com/baejinim" className="group p-2">
                <GitHubIcon
                  size={28}
                  className="text-quaternary group-hover:text-primary select-none"
                />
              </ListItem>
            </Section>

            <Section>
              <SectionHeading>Projects</SectionHeading>
              <List>
                {projects.map(({ name, href, description, external }) => (
                  <ListItem
                    key={name}
                    href={href}
                    className="flex-col items-start gap-0 sm:flex-row sm:items-center sm:gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <ListItemLabel className="sm:line-clamp-1">{name}</ListItemLabel>
                      {external && (
                        <ListItemSubLabel className="shrink-0 font-mono">
                          <ArrowUpRight className="text-primary" />
                        </ListItemSubLabel>
                      )}
                    </div>
                    <ListItemSubLabel className="flex-1">{description}</ListItemSubLabel>
                  </ListItem>
                ))}
              </List>
            </Section>

            {/* Work and Speaking sections removed to keep site focused on Writing */}
          </div>
        </div>
      </div>
    </>
  );
}

const projects = [
  {
    name: "Writing",
    href: "/writing",
    description: "Notes on software and other things",
    external: false,
  },
];

// work items removed
