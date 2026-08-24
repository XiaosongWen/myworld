# Project Instructions & Workflow Rules

- **GitHub Sub-Issues**: When creating or linking sub-issues to a parent Epic issue on GitHub, do NOT rely on standard markdown descriptions alone (`Parent Epic: #X`). Always execute the GitHub GraphQL `addSubIssue` mutation (`addSubIssue(input: {issueId: "<parent_node_id>", subIssueId: "<child_node_id>"})`) using `gh api graphql` so GitHub natively displays the sub-issue under the parent Epic.
