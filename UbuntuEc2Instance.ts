import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { KeyPair } from "@cdktf/provider-aws/lib/key-pair";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { Annotations } from "cdktf";
import { Construct } from "constructs";

export interface UbuntuEc2InstanceConfig {
  name: string;
  securityGroup: SecurityGroup;
  keyPair?: KeyPair;
  instanceType?: "t3.micro" | "t2.micro";
}

export class UbuntuEc2Instance extends Construct {
  private readonly ec2: Instance;

  constructor(
    scope: Construct,
    id: string,
    private readonly config: UbuntuEc2InstanceConfig
  ) {
    super(scope, id);

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

    const { name: Name, instanceType = "t3.micro" } = this.config;

    if (Name.length === 0) {
      Annotations.of(this).addError("name most be at least one char");
    }

    this.ec2 = new Instance(this, "web", {
      ami: ubuntuAmi.id,
      instanceType,
      keyName: this.config.keyPair?.keyName,
      securityGroups: [this.config.securityGroup.name],

      tags: {
        Name,
      },
    });
  }

  public get publicIp(): string {
    return this.ec2.publicIp;
  }
}
