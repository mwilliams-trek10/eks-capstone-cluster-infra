import BackendApplicationTeam from './BackendApplicationTeam'
import EksPlatformTeam from './EksPlatformTeam'
import FrontendApplicationTeam from './FrontendApplicationTeam'
import {PlatformTeam, Team} from "@aws-quickstart/eks-blueprints";
import ReportApplicationTeam from "./ReportApplicationTeam";

const getTeams = function(account: string) : Team[] {

    const eksPlatformTeam: PlatformTeam = new EksPlatformTeam(account);

    const frontendApplicationTeam: FrontendApplicationTeam = new FrontendApplicationTeam('frontend-team', account);

    const backendApplicationTeam: BackendApplicationTeam = new BackendApplicationTeam('backend-team', account);

    const reportApplicationTeam: ReportApplicationTeam = new ReportApplicationTeam('report-team', account);

    return [eksPlatformTeam, frontendApplicationTeam, backendApplicationTeam, reportApplicationTeam];
};

export {getTeams}
