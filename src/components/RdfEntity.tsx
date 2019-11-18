import { Link, Tooltip } from "@material-ui/core";
import classNames from "classnames";
import * as React from "react";
import { resourceManager } from "../localization";
import { dataService } from "../services";
import { tryGetFullUri } from "../services/dataConfig";
import { RdfQName, useLabelFor } from "../services/dataService";
import Scss from "./RdfEntity.scss";

export interface IRdfEntityLinkProps {
    qName: RdfQName;
    title?: React.ReactNode;
}

export const RdfEntityLink: React.FC<IRdfEntityLinkProps> = (props) => {
    const uri = props.qName && tryGetFullUri(props.qName);
    let title = props.title;
    if (title === undefined && uri) {
        title = resourceManager.getPrompt("GoToEntityDataSource");
        if (props.qName.startsWith("wd:")) {
            title += resourceManager.getPrompt("Brackets", ["Crystal Pool"]);
        }
    }
    return (<Tooltip title={title}>
        {uri
            ? <Link className="entity-id entity-uri-link" href={uri}>{props.qName}</Link>
            : <span className="entity-id entity-not-expandable">{props.qName}</span>}
    </Tooltip>);
};
RdfEntityLink.displayName = "RdfEntityLink";

export interface IRdfEntityLabelProps {
    qName: RdfQName;
    fallbackLabel?: React.ReactNode;
    showEntityId?: boolean;
}

export const RdfEntityLabel: React.FC<IRdfEntityLabelProps> = (props) => {
    const label = useLabelFor(dataService, props.qName)?.label;
    if (!props.showEntityId && !label) {
        // Missing label, and we need to show label only.
        return (<span className={Scss.entityLabelContainer}>
            <span className={Scss.entityLabelFallback}>{props.fallbackLabel ?? props.qName}</span>
        </span>);
    } else {
        return (<span className={Scss.entityLabelContainer}>
            <span className={classNames(!label && Scss.entityLabelFallback)}>{label || props.fallbackLabel}</span>
            {props.showEntityId && (<span className={Scss.entityId}>{resourceManager.renderPrompt("Brackets", [<RdfEntityLink key={0} qName={props.qName} />])}</span>)}
        </span>);
    }
};
RdfEntityLabel.displayName = "RdfEntityLabel";

export interface IRdfEntityDescriptionProps {
    qName: RdfQName;
    fallbackContent?: React.ReactNode;
}

export const RdfEntityDescription: React.FC<IRdfEntityDescriptionProps> = (props) => {
    const label = useLabelFor(dataService, props.qName);
    return <span>{label && label.description || props.fallbackContent}</span>;
};
RdfEntityDescription.displayName = "RdfEntityDescription";
