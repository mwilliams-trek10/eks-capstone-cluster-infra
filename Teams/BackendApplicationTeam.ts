import {ApplicationTeam, ClusterInfo} from "@aws-quickstart/eks-blueprints";
import {ArnPrincipal} from "aws-cdk-lib/aws-iam";

export default class BackendApplicationTeam extends ApplicationTeam {
    constructor(name: string, accountID: string) {
        super({
            name: name,
            userRoleArn: `arn:aws:iam::${accountID}:role/backend_application_team`,
            // namespace: 'backend'
        });
    }
}
