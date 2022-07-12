import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Easy to Use",
    Svg: require("@site/static/img/easy-to-use.svg").default,
    description: (
      <>
        BHO SDK is designed with simplicity in mind. This allows developers to grasp the SDK quickly
        and get straight into usage.
      </>
    ),
  },
  {
    title: "Developers-driven",
    Svg: require("@site/static/img/developers-driven.svg").default,
    description: (
      <>
        Since we want to ensure the best DX (developers experience) for our developers, we're open
        to receive feedbacks to fix bugs as well as new feature proposals.
      </>
    ),
  },
  {
    title: "Written in your favorite language",
    Svg: require("@site/static/img/fav-language.svg").default,
    description: (
      <>
        BHO SDK is written in Javscript, the most used language for web applications. The SDK
        supports both browser and Node.js environments.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
