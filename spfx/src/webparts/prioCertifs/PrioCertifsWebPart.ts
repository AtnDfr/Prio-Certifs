import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { type IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import PrioCertifsApp from './app/App';

export interface IPrioCertifsWebPartProps {
  description: string;
}

export default class PrioCertifsWebPart extends BaseClientSideWebPart<IPrioCertifsWebPartProps> {

  public render(): void {
    const element: React.ReactElement = React.createElement(PrioCertifsApp, {
      context: this.context,
    });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    // Pas de configuration exposee : les listes/colonnes cibles sont fixees
    // dans app/data/spConfig.ts (site courant, noms de listes/colonnes).
    return { pages: [] };
  }
}
