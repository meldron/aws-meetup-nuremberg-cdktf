import { Construct } from "constructs";
import { App, TerraformOutput, TerraformStack, Fn } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { KeyPair } from "@cdktf/provider-aws/lib/key-pair";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { readFileSync } from "fs";
import { Vpc } from "./.gen/modules/vpc";
import { UbuntuEc2Instance } from "./UbuntuEc2Instance";

interface AwsSettings {
  accessKey: string;
  secretKey: string;
  region: string;
}

interface AwsMeetupConfig {
  awsSettings: AwsSettings;
  sshPublicKey?: { keyName: string; publicKey: string };
}

export class AwsMeetupStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: AwsMeetupConfig) {
    super(scope, id);

    const { awsSettings, sshPublicKey } = config;

    new AwsProvider(this, "aws", { ...awsSettings });

    const keyPair = sshPublicKey
      ? new KeyPair(this, "KeyPair", { ...sshPublicKey })
      : undefined;

    const securityGroup = new SecurityGroup(this, "ssh-security-group", {
      name: "ssh-access",
      description: "Security group for SSH access",
      ingress: [
        {
          description: "SSH",
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"], // allows any IP to connect, consider restricting this
        },
      ],
    });

    const ubuntuAmi = new DataAwsAmi(this, "ubuntu-ami", {
      mostRecent: true,
      filter: [
        {
          name: "name",
          values: ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"],
        },
        {
          name: "virtualization-type",
          values: ["hvm"],
        },
      ],
      owners: ["099720109477"],
    });

    const cidr = "10.0.0.0/16";
    const azs = ["eu-west-1a", "eu-west-1b", "eu-west-1c"];
    const privateSubnets = azs.map((_, i) => Fn.cidrsubnet(cidr, 4, i + 1));

    const vpc = new Vpc(this, "vpc", {
      name: "vpc-test",
      azs,
      cidr,
      privateSubnets,
    });

    const ec2 = new Instance(this, "web", {
      ami: ubuntuAmi.id,
      instanceType: "t3.micro",
      keyName: keyPair?.keyName,
      securityGroups: [securityGroup.name],
      tags: {
        Name: "web",
      },
    });

    const ec2Web = new UbuntuEc2Instance(this, "web2", {
      name: "MyName",
      securityGroup,
      keyPair,
      instanceType: "t2.micro",
    });

    new TerraformOutput(this, "web-ip", {
      description: "ip of the ec2 web instance",
      value: ec2.publicIp,
    });

    new TerraformOutput(this, "web-2-ip", {
      description: "ip of the ec2 web instance",
      value: ec2Web.publicIp,
    });
  }
}

const AWS_SETTINGS_PATH = process.env.AWS_SETTINGS_PATH
  ? process.env.AWS_SETTINGS_PATH
  : "./awscreds.json";

function loadAwsSettings(): AwsSettings {
  const content = readFileSync(AWS_SETTINGS_PATH, { encoding: "utf-8" });
  const json = JSON.parse(content);

  return json;
}

const SSH_PUBLIC_KEY_NAME = process.env.SSH_PUBLIC_KEY_NAME;
const SSH_PUBLIC_KEY_VALUE = process.env.SSH_PUBLIC_KEY_VALUE;

const sshPublicKey =
  SSH_PUBLIC_KEY_NAME && SSH_PUBLIC_KEY_VALUE
    ? {
        keyName: SSH_PUBLIC_KEY_NAME,
        publicKey: SSH_PUBLIC_KEY_VALUE,
      }
    : undefined;

const app = new App();
new AwsMeetupStack(app, "aws-meetup-dev", {
  awsSettings: loadAwsSettings(),
  sshPublicKey,
});
app.synth();
