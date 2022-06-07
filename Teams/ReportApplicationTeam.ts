import {ApplicationTeam} from "@aws-quickstart/eks-blueprints";
import {ArnPrincipal} from "aws-cdk-lib/aws-iam";

export default class ReportApplicationTeam extends ApplicationTeam {
    constructor(name: string, accountID: string) {
        super({
            name: name,
            userRoleArn: `arn:aws:iam::${accountID}:role/report_application_team`,
            // namespace: 'reporting'
        });
    }
}
